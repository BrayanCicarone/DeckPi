# executor.py — motor de execucao dos passos de uma macro via USB HID.
#
# Tipos de passo suportados:
#   text   -> digita uma string (KeyboardLayoutUS)
#   combo  -> pressiona teclas em conjunto e solta (ex.: CTRL + C)
#   delay  -> pausa em milissegundos
#   media  -> tecla de midia (volume, play/pause, mute...)
#   launch -> abre um programa emulando as teclas do SO (Windows/Mac)

import time

import usb_hid
from adafruit_hid.keyboard import Keyboard
from adafruit_hid.keyboard_layout_us import KeyboardLayoutUS
from adafruit_hid.keycode import Keycode
from adafruit_hid.consumer_control import ConsumerControl
from adafruit_hid.consumer_control_code import ConsumerControlCode

# Instancias unicas dos dispositivos HID.
_kbd = Keyboard(usb_hid.devices)
_layout = KeyboardLayoutUS(_kbd)
_cc = ConsumerControl(usb_hid.devices)

# Mapa de nomes -> Keycode para os combos. Nomes em MAIUSCULAS.
KEYCODE_MAP = {
    # modificadores
    "CTRL": Keycode.CONTROL, "CONTROL": Keycode.CONTROL,
    "ALT": Keycode.ALT, "OPTION": Keycode.ALT,
    "SHIFT": Keycode.SHIFT,
    "GUI": Keycode.GUI, "WIN": Keycode.GUI, "CMD": Keycode.GUI, "COMMAND": Keycode.GUI,
    # teclas de controle
    "ENTER": Keycode.ENTER, "RETURN": Keycode.RETURN,
    "ESC": Keycode.ESCAPE, "ESCAPE": Keycode.ESCAPE,
    "TAB": Keycode.TAB, "SPACE": Keycode.SPACE,
    "BACKSPACE": Keycode.BACKSPACE, "DELETE": Keycode.DELETE, "DEL": Keycode.DELETE,
    "INSERT": Keycode.INSERT, "HOME": Keycode.HOME, "END": Keycode.END,
    "PAGEUP": Keycode.PAGE_UP, "PAGEDOWN": Keycode.PAGE_DOWN,
    "CAPSLOCK": Keycode.CAPS_LOCK, "PRINTSCREEN": Keycode.PRINT_SCREEN,
    # setas
    "UP": Keycode.UP_ARROW, "DOWN": Keycode.DOWN_ARROW,
    "LEFT": Keycode.LEFT_ARROW, "RIGHT": Keycode.RIGHT_ARROW,
    # F1..F12
    "F1": Keycode.F1, "F2": Keycode.F2, "F3": Keycode.F3, "F4": Keycode.F4,
    "F5": Keycode.F5, "F6": Keycode.F6, "F7": Keycode.F7, "F8": Keycode.F8,
    "F9": Keycode.F9, "F10": Keycode.F10, "F11": Keycode.F11, "F12": Keycode.F12,
}

# Mapa de teclas de midia.
MEDIA_MAP = {
    "VOLUME_UP": ConsumerControlCode.VOLUME_INCREMENT,
    "VOLUME_DOWN": ConsumerControlCode.VOLUME_DECREMENT,
    "MUTE": ConsumerControlCode.MUTE,
    "PLAY_PAUSE": ConsumerControlCode.PLAY_PAUSE,
    "NEXT": ConsumerControlCode.SCAN_NEXT_TRACK,
    "PREVIOUS": ConsumerControlCode.SCAN_PREVIOUS_TRACK,
    "STOP": ConsumerControlCode.STOP,
}


def _keycode(name):
    """Resolve o nome de uma tecla para Keycode (letras/digitos por atributo)."""
    key = str(name).strip().upper()
    if key in KEYCODE_MAP:
        return KEYCODE_MAP[key]
    # Letras A-Z e digitos 0-9 viram atributos do Keycode (A..Z, ZERO..NINE).
    if len(key) == 1 and "A" <= key <= "Z":
        return getattr(Keycode, key)
    if len(key) == 1 and "0" <= key <= "9":
        digit_names = ("ZERO", "ONE", "TWO", "THREE", "FOUR",
                       "FIVE", "SIX", "SEVEN", "EIGHT", "NINE")
        return getattr(Keycode, digit_names[int(key)])
    raise ValueError("Tecla desconhecida: %r" % name)


def _do_combo(keys):
    codes = [_keycode(k) for k in keys]
    _kbd.press(*codes)
    time.sleep(0.02)
    _kbd.release_all()


def _do_launch(target, os_name, method="search"):
    """Abre um programa emulando as teclas do sistema operacional."""
    os_name = (os_name or "windows").lower()
    if os_name == "mac":
        # Spotlight: Cmd+Espaco -> digita -> Enter
        _kbd.press(Keycode.GUI, Keycode.SPACE)
        _kbd.release_all()
        time.sleep(0.4)
        _layout.write(target)
        time.sleep(0.4)
        _kbd.press(Keycode.ENTER)
        _kbd.release_all()
    else:
        if method == "run":
            # Win+R: caixa Executar -> caminho/exe -> Enter
            _kbd.press(Keycode.GUI, _keycode("R"))
            _kbd.release_all()
            time.sleep(0.4)
            _layout.write(target)
            time.sleep(0.2)
            _kbd.press(Keycode.ENTER)
            _kbd.release_all()
        else:
            # Menu Iniciar: tecla Win -> busca -> Enter
            _kbd.press(Keycode.GUI)
            _kbd.release_all()
            time.sleep(0.4)
            _layout.write(target)
            time.sleep(0.5)
            _kbd.press(Keycode.ENTER)
            _kbd.release_all()


def run_steps(steps, os_name="windows", default_delay_ms=30, launch_method="search"):
    """Executa a lista de passos de uma macro.

    os_name: 'windows' ou 'mac' (vem do perfil) — usado pelo passo launch.
    default_delay_ms: pausa entre passos (alem dos delays explicitos).
    """
    for step in steps:
        kind = step.get("type")
        try:
            if kind == "text":
                _layout.write(step.get("value", ""))
            elif kind == "combo":
                _do_combo(step.get("keys", []))
            elif kind == "delay":
                time.sleep(int(step.get("ms", 0)) / 1000)
            elif kind == "media":
                code = MEDIA_MAP.get(str(step.get("key", "")).upper())
                if code is not None:
                    _cc.send(code)
            elif kind == "launch":
                _do_launch(
                    step.get("target", ""),
                    os_name,
                    step.get("method", launch_method),
                )
            else:
                print("[executor] passo ignorado (tipo desconhecido):", kind)
        except Exception as exc:  # nunca derrubar o servidor por um passo ruim
            print("[executor] erro no passo %r: %s" % (kind, exc))
        # Cada passo pode sobrescrever a pausa padrao apos ele (delayAfter).
        after = step.get("delayAfter")
        if after is None:
            time.sleep(default_delay_ms / 1000)
        else:
            time.sleep(max(0, int(after)) / 1000)
