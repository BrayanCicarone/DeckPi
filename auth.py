# auth.py — senha de acesso ao painel (hash salgado) + token de sessao.
#
# A senha NUNCA e guardada em texto puro: armazenamos salt + SHA-256(salt+senha)
# em auth.json. As sessoes ficam apenas em memoria (token -> expiracao); um
# reboot do Pico invalida todas as sessoes, o que e aceitavel.

import json
import os
import time
import binascii

try:
    # O hashlib embutido do CircuitPython pode existir MAS sem sha256;
    # por isso checamos o atributo, nao so o import.
    import hashlib
    hashlib.sha256
except (ImportError, AttributeError):
    import adafruit_hashlib as hashlib

AUTH_PATH = "/auth.json"
SESSION_TTL = 7 * 24 * 60 * 60  # 7 dias em segundos

# Sessoes ativas: token (str) -> expiracao (time.monotonic)
_sessions = {}


def _hex(data):
    return binascii.hexlify(data).decode("ascii")


def _hash_password(password, salt_hex):
    h = hashlib.sha256()
    h.update(salt_hex.encode("utf-8"))
    h.update(password.encode("utf-8"))
    return _hex(h.digest())


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
    """Gera um token de sessao novo e registra sua expiracao."""
    token = _hex(os.urandom(24))
    _sessions[token] = time.monotonic() + SESSION_TTL
    return token


def valid_session(token):
    if not token:
        return False
    exp = _sessions.get(token)
    if exp is None:
        return False
    if time.monotonic() > exp:
        _sessions.pop(token, None)
        return False
    return True


def destroy_session(token):
    _sessions.pop(token, None)
