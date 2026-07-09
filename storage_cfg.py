# storage_cfg.py — carregar/salvar a configuracao (perfis, grupos, botoes).
#
# A config vive em config.json na flash. Em operacao normal o drive USB esta
# desabilitado (ver boot.py), entao o codigo consegue gravar. Em modo
# manutencao a gravacao falha (flash somente-leitura para o codigo) — nesse
# caso apenas avisamos no console.

import json

CONFIG_PATH = "/config.json"


def _default_config():
    return {
        "version": 1,
        "activeProfile": "p1",
        "settings": {"stepDelayMs": 30, "launchMethod": "search"},
        "profiles": [
            {
                "id": "p1",
                "name": "Windows",
                "os": "windows",
                "icon": "🪟",
                "groups": [
                    {
                        "id": "g1",
                        "name": "Geral",
                        "icon": "⭐",
                        "buttons": [
                            {
                                "id": "b1",
                                "label": "Copiar",
                                "emoji": "📋",
                                "icon": "",
                                "color": "#3b82f6",
                                "steps": [{"type": "combo", "keys": ["CTRL", "C"]}],
                            },
                            {
                                "id": "b2",
                                "label": "Colar",
                                "emoji": "📥",
                                "icon": "",
                                "color": "#22c55e",
                                "steps": [{"type": "combo", "keys": ["CTRL", "V"]}],
                            },
                        ],
                    }
                ],
            }
        ],
    }


def load_config():
    """Le config.json; se ausente/invalido, cria e grava o padrao."""
    try:
        with open(CONFIG_PATH, "r") as fp:
            return json.load(fp)
    except (OSError, ValueError):
        cfg = _default_config()
        save_config(cfg)
        return cfg


def save_config(cfg):
    """Grava a config na flash. Retorna True/False conforme sucesso."""
    try:
        with open(CONFIG_PATH, "w") as fp:
            json.dump(cfg, fp)
        return True
    except OSError as exc:
        # Tipicamente "read-only filesystem" em modo manutencao.
        print("[storage] NAO foi possivel gravar config.json:", exc)
        return False


def find_button(cfg, profile_id, button_id):
    """Localiza um botao por perfil/id; retorna (button, profile) ou (None, None)."""
    for prof in cfg.get("profiles", []):
        if prof.get("id") != profile_id:
            continue
        btn = find_button_in_profile(prof, button_id)
        if btn is not None:
            return btn, prof
    return None, None


def find_button_in_profile(prof, button_id):
    """Localiza um botao dentro de um perfil; retorna o botao ou None."""
    if not prof:
        return None
    for group in prof.get("groups", []):
        for btn in group.get("buttons", []):
            if btn.get("id") == button_id:
                return btn
    return None


def active_profile(cfg):
    """Retorna o perfil ativo (ou o primeiro)."""
    pid = cfg.get("activeProfile")
    profs = cfg.get("profiles", [])
    for prof in profs:
        if prof.get("id") == pid:
            return prof
    return profs[0] if profs else None
