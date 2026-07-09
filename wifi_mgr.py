# wifi_mgr.py — conexao WiFi com fallback para AP de provisionamento.
#
# No boot:
#   - Le wifi.json (gravado pelo provisionamento).
#   - Tenta conectar (modo station). Se ok, retorna ("station", ip).
#   - Se nao houver credenciais ou a conexao falhar, sobe um Access Point
#     ("ControlPainel-Setup") e retorna ("ap", ip) para o code.py servir a
#     pagina de setup.

import json
import time

import wifi

WIFI_PATH = "/wifi.json"
AP_SSID = "ControlPainel-Setup"
AP_PASSWORD = "controlpainel"  # >= 8 chars; troque se quiser
CONNECT_TIMEOUT = 15  # segundos por tentativa
CONNECT_RETRIES = 2


def load_credentials():
    try:
        with open(WIFI_PATH, "r") as fp:
            data = json.load(fp)
        return data.get("ssid"), data.get("password", "")
    except (OSError, ValueError):
        return None, None


def save_credentials(ssid, password):
    try:
        with open(WIFI_PATH, "w") as fp:
            json.dump({"ssid": ssid, "password": password}, fp)
        return True
    except OSError as exc:
        print("[wifi] NAO foi possivel gravar wifi.json:", exc)
        return False


def _try_station(ssid, password):
    for attempt in range(1, CONNECT_RETRIES + 1):
        try:
            print("[wifi] conectando em %r (tentativa %d)..." % (ssid, attempt))
            wifi.radio.connect(ssid, password, timeout=CONNECT_TIMEOUT)
            ip = str(wifi.radio.ipv4_address)
            print("[wifi] conectado! IP:", ip)
            return ip
        except Exception as exc:
            print("[wifi] falha:", exc)
            time.sleep(1)
    return None


def start_ap():
    """Sobe o Access Point de provisionamento e retorna o IP do portal."""
    print("[wifi] subindo AP de setup:", AP_SSID)
    wifi.radio.stop_station()
    wifi.radio.start_ap(AP_SSID, AP_PASSWORD)
    ip = str(wifi.radio.ipv4_address_ap)
    print("[wifi] AP no ar. Conecte-se a '%s' (senha: %s) e acesse http://%s"
          % (AP_SSID, AP_PASSWORD, ip))
    return ip


def bring_up(force_ap=False):
    """Sobe a rede. Retorna (modo, ip) onde modo e 'station' ou 'ap'."""
    if not force_ap:
        ssid, password = load_credentials()
        if ssid:
            ip = _try_station(ssid, password)
            if ip:
                return "station", ip
        else:
            print("[wifi] sem credenciais salvas.")
    return "ap", start_ap()
