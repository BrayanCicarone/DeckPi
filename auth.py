# auth.py — senha de acesso ao painel (hash salgado) + token de sessao.
#
# A senha NUNCA e guardada em texto puro: armazenamos salt + SHA-256(salt+senha)
# em auth.json.
#
# Sessoes ficam gravadas em sessions.json (nao so em memoria) para sobreviver
# a reboots/crashes do Pico. O CircuitPython nao tem relogio de parede
# confiavel sem sincronizar NTP, entao nao guardamos "expiracao" por data —
# uma sessao fica valida ate o logout explicito ou a lista ficar cheia
# (a mais antiga e descartada). Isso satisfaz o pedido de "sessao de pelo
# menos uma semana" adequado a um dispositivo pessoal em rede domestica.

import json
import os
import binascii

try:
    # O hashlib embutido do CircuitPython pode existir MAS sem sha256;
    # por isso checamos o atributo, nao so o import.
    import hashlib
    hashlib.sha256
except (ImportError, AttributeError):
    import adafruit_hashlib as hashlib

AUTH_PATH = "/auth.json"
SESSIONS_PATH = "/sessions.json"
MAX_SESSIONS = 10  # evita crescimento sem limite do arquivo
# Nao ha expiracao real no servidor (ver create_session/valid_session); este
# valor so define o Max-Age do cookie no navegador (~1 ano, "essencialmente
# permanente" ate logout).
SESSION_TTL = 365 * 24 * 60 * 60

# Sessoes ativas (lista de tokens), carregadas do disco no boot.
_sessions = []


def _hex(data):
    return binascii.hexlify(data).decode("ascii")


def _hash_password(password, salt_hex):
    h = hashlib.sha256()
    h.update(salt_hex.encode("utf-8"))
    h.update(password.encode("utf-8"))
    return _hex(h.digest())


def _load_sessions():
    try:
        with open(SESSIONS_PATH, "r") as fp:
            data = json.load(fp)
        if isinstance(data, list):
            return data
    except (OSError, ValueError):
        pass
    return []


def _save_sessions():
    try:
        with open(SESSIONS_PATH, "w") as fp:
            json.dump(_sessions, fp)
    except OSError as exc:
        print("[auth] NAO foi possivel gravar sessions.json:", exc)


_sessions = _load_sessions()


def is_valid_pin(pin):
    """PIN deve ter exatamente 4 digitos numericos."""
    return isinstance(pin, str) and len(pin) == 4 and pin.isdigit()


def is_configured():
    """True se ja existe uma senha definida."""
    try:
        with open(AUTH_PATH, "r") as fp:
            data = json.load(fp)
        return bool(data.get("hash"))
    except (OSError, ValueError):
        return False


def set_password(password):
    """Define/atualiza a senha do painel. Retorna True/False (gravacao)."""
    salt_hex = _hex(os.urandom(16))
    data = {"salt": salt_hex, "hash": _hash_password(password, salt_hex)}
    try:
        with open(AUTH_PATH, "w") as fp:
            json.dump(data, fp)
        return True
    except OSError as exc:
        print("[auth] NAO foi possivel gravar auth.json:", exc)
        return False


def check_password(password):
    try:
        with open(AUTH_PATH, "r") as fp:
            data = json.load(fp)
    except (OSError, ValueError):
        return False
    return _hash_password(password, data["salt"]) == data["hash"]


def create_session():
    """Gera um token de sessao novo, persiste e retorna o token."""
    token = _hex(os.urandom(24))
    _sessions.append(token)
    while len(_sessions) > MAX_SESSIONS:
        _sessions.pop(0)  # descarta a sessao mais antiga
    _save_sessions()
    return token


def valid_session(token):
    return bool(token) and token in _sessions


def destroy_session(token):
    if token in _sessions:
        _sessions.remove(token)
        _save_sessions()
