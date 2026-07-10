# code.py — ponto de entrada do firmware do Painel de Controle.
#
# Fluxo:
#   1. Sobe a rede (station com wifi.json, ou AP de provisionamento).
#   2. Em modo AP: serve setup.html + POST /api/wifi (salva e reinicia).
#   3. Em modo station: serve o painel (/www) + API protegida por sessao.

import gc
import json
import time

import microcontroller
import socketpool
import wifi

from adafruit_httpserver import Server, Request, Response, JSONResponse, FileResponse, GET, POST, PUT

import wifi_mgr
import storage_cfg
import auth
import executor

WWW_ROOT = "/www"

# --- Sobe a rede ----------------------------------------------------------
mode, ip = wifi_mgr.bring_up()

pool = socketpool.SocketPool(wifi.radio)
server = Server(pool, WWW_ROOT, debug=True)


# --- Helpers de sessao ----------------------------------------------------
def _token_from(request):
    """Extrai o token de sessao do cookie 'session' ou header Authorization."""
    cookie = request.headers.get("Cookie") or ""
    for part in cookie.split(";"):
        part = part.strip()
        if part.startswith("session="):
            return part[len("session="):]
    authz = request.headers.get("Authorization") or ""
    if authz.startswith("Bearer "):
        return authz[len("Bearer "):]
    return None


def _authed(request):
    return auth.valid_session(_token_from(request))


def _unauthorized(request):
    return JSONResponse(request, {"error": "unauthorized"}, status=(401, "Unauthorized"))


# =========================================================================
# MODO AP — provisionamento de WiFi
# =========================================================================
if mode == "ap":

    @server.route("/", GET)
    def setup_page(request: Request):
        return FileResponse(request, "setup.html", WWW_ROOT)

    @server.route("/api/wifi", POST)
    def save_wifi(request: Request):
        data = request.json()
        ssid = (data or {}).get("ssid", "").strip()
        password = (data or {}).get("password", "")
        if not ssid:
            return JSONResponse(request, {"error": "ssid obrigatorio"},
                                status=(400, "Bad Request"))
        ok = wifi_mgr.save_credentials(ssid, password)
        if not ok:
            return JSONResponse(request, {"error": "falha ao gravar (modo manutencao?)"},
                                status=(500, "Server Error"))
        # Responde sucesso; o setup.html chama /api/reboot em seguida.
        return JSONResponse(request, {"ok": True})

    @server.route("/api/reboot", POST)
    def do_reboot(request: Request):
        microcontroller.reset()
        return JSONResponse(request, {"ok": True})

# =========================================================================
# MODO STATION — painel completo
# =========================================================================
else:

    @server.route("/", GET)
    def index(request: Request):
        # O proprio painel decide mostrar login ou conteudo conforme a sessao.
        if not auth.is_configured():
            return FileResponse(request, "login.html", WWW_ROOT)
        if not _authed(request):
            return FileResponse(request, "login.html", WWW_ROOT)
        return FileResponse(request, "index.html", WWW_ROOT)

    # ---- Autenticacao ----
    @server.route("/api/auth/state", GET)
    def auth_state(request: Request):
        return JSONResponse(request, {
            "configured": auth.is_configured(),
            "authenticated": _authed(request),
        })

    @server.route("/api/login", POST)
    def login(request: Request):
        data = request.json() or {}
        password = data.get("password", "")
        # Primeiro acesso: define o PIN.
        if not auth.is_configured():
            if not auth.is_valid_pin(password):
                return JSONResponse(request, {"error": "PIN deve ter 4 digitos"},
                                    status=(400, "Bad Request"))
            if not auth.set_password(password):
                return JSONResponse(request, {"error": "falha ao gravar PIN"},
                                    status=(500, "Server Error"))
        elif not auth.check_password(password):
            return JSONResponse(request, {"error": "PIN invalido"},
                                status=(401, "Unauthorized"))
        token = auth.create_session()
        return JSONResponse(request, {"ok": True}, headers={
            "Set-Cookie": "session=%s; Path=/; Max-Age=%d; SameSite=Lax" % (
                token, auth.SESSION_TTL),
        })

    @server.route("/api/logout", POST)
    def logout(request: Request):
        auth.destroy_session(_token_from(request))
        return JSONResponse(request, {"ok": True}, headers={
            "Set-Cookie": "session=; Path=/; Max-Age=0",
        })

    @server.route("/api/password", POST)
    def change_password(request: Request):
        if not _authed(request):
            return _unauthorized(request)
        data = request.json() or {}
        new = data.get("password", "")
        if not auth.is_valid_pin(new):
            return JSONResponse(request, {"error": "PIN deve ter 4 digitos"},
                                status=(400, "Bad Request"))
        if not auth.set_password(new):
            return JSONResponse(request, {"error": "falha ao gravar"},
                                status=(500, "Server Error"))
        return JSONResponse(request, {"ok": True})

    # ---- Status ----
    @server.route("/api/status", GET)
    def status(request: Request):
        if not _authed(request):
            return _unauthorized(request)
        cfg = storage_cfg.load_config()
        return JSONResponse(request, {
            "ip": ip,
            "activeProfile": cfg.get("activeProfile"),
            "version": cfg.get("version"),
        })

    # ---- Config ----
    @server.route("/api/config", GET)
    def get_config(request: Request):
        if not _authed(request):
            return _unauthorized(request)
        return JSONResponse(request, storage_cfg.load_config())

    @server.route("/api/config", PUT)
    def put_config(request: Request):
        if not _authed(request):
            return _unauthorized(request)
        cfg = request.json()
        if not isinstance(cfg, dict) or "profiles" not in cfg:
            return JSONResponse(request, {"error": "config invalida"},
                                status=(400, "Bad Request"))
        if not storage_cfg.save_config(cfg):
            return JSONResponse(request, {"error": "falha ao gravar (modo manutencao?)"},
                                status=(500, "Server Error"))
        return JSONResponse(request, {"ok": True})

    # ---- Execucao ----
    def _expand_steps(prof, steps, depth=0):
        """Expande passos do tipo 'macro' (referencia a outra macro do perfil).

        Recursivo, com limite de profundidade para evitar loops infinitos.
        """
        if not prof or depth > 6:
            return [s for s in steps if s.get("type") != "macro"]
        out = []
        for st in steps:
            if st.get("type") == "macro":
                ref = storage_cfg.find_button_in_profile(prof, st.get("ref"))
                if ref is not None:
                    out.extend(_expand_steps(prof, ref.get("steps", []), depth + 1))
            else:
                out.append(st)
        return out

    @server.route("/api/execute", POST)
    def execute(request: Request):
        if not _authed(request):
            return _unauthorized(request)
        data = request.json() or {}
        cfg = storage_cfg.load_config()
        settings = cfg.get("settings", {})
        steps = data.get("steps")
        os_name = "windows"
        if steps is None:
            # Executa um botao por id.
            btn, prof = storage_cfg.find_button(
                cfg, data.get("profileId"), data.get("buttonId"))
            if btn is None:
                return JSONResponse(request, {"error": "botao nao encontrado"},
                                    status=(404, "Not Found"))
            steps = btn.get("steps", [])
            os_name = (prof or {}).get("os", "windows")
        else:
            os_name = data.get("os", "windows")
            prof = storage_cfg.active_profile(cfg)
        # Resolve referencias a outras macros antes de executar.
        steps = _expand_steps(prof, steps)
        executor.run_steps(
            steps,
            os_name=os_name,
            default_delay_ms=settings.get("stepDelayMs", 30),
            launch_method=settings.get("launchMethod", "search"),
        )
        return JSONResponse(request, {"ok": True})


# --- Loop principal -------------------------------------------------------
print("[server] iniciando em http://%s (modo: %s)" % (ip, mode))
server.start(str(ip), port=80)

WIFI_CHECK_INTERVAL = 15  # segundos entre verificacoes de conectividade
_last_wifi_check = time.monotonic()

while True:
    try:
        server.poll()
    except Exception as exc:
        print("[server] erro no poll:", exc)

    # Watchdog de WiFi: em modo station, detecta queda de conexao e
    # reconecta sozinho (sem isso o Pico fica preso servindo uma rede
    # morta ate alguem religar manualmente).
    if mode == "station":
        now = time.monotonic()
        if now - _last_wifi_check > WIFI_CHECK_INTERVAL:
            _last_wifi_check = now
            if not wifi.radio.connected:
                print("[wifi] conexao perdida, tentando reconectar...")
                new_ip = wifi_mgr.reconnect()
                if new_ip:
                    if new_ip != ip:
                        ip = new_ip
                        try:
                            server.stop()
                        except Exception as exc:
                            print("[server] erro ao parar:", exc)
                        server.start(str(ip), port=80)
                    print("[wifi] reconectado! IP:", ip)
                else:
                    print("[wifi] falha ao reconectar; tentara novamente.")

    # Coleta de lixo periodica: evita fragmentacao de memoria em sessoes
    # longas (o Pico tem RAM limitada e faz muitas alocacoes de JSON).
    gc.collect()
