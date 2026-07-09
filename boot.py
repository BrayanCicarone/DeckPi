# boot.py — executa antes do USB conectar ao host.
#
# Responsabilidades:
#   1. Habilitar os dispositivos HID (teclado + controle de midia).
#   2. Em operacao normal, DESABILITAR o drive USB (CIRCUITPY) para que o
#      proprio codigo possa gravar na flash (config.json, wifi.json, auth.json).
#   3. Modo manutencao: se um jumper estiver ligando GP15 ao GND no boot,
#      o drive USB permanece visivel para edicao dos arquivos pelo PC.

import board
import digitalio
import storage
import usb_hid

# --- Jumper de manutencao -------------------------------------------------
# Ligue GP15 ao GND para entrar em modo manutencao (drive USB visivel).
maintenance = digitalio.DigitalInOut(board.GP15)
maintenance.direction = digitalio.Direction.INPUT
maintenance.pull = digitalio.Pull.UP  # solto = True (alto); jumper p/ GND = False
MAINTENANCE_MODE = not maintenance.value
maintenance.deinit()

# --- HID: teclado + controle de midia ------------------------------------
# Apenas teclado e ConsumerControl; sem mouse para manter o descritor enxuto.
# NAO usar boot_device=1: ele exige a interface HID como #0, o que conflita
# com o console serial (CDC) e joga o Pico em safe mode.
usb_hid.enable((usb_hid.Device.KEYBOARD, usb_hid.Device.CONSUMER_CONTROL))

# --- Drive USB ------------------------------------------------------------
if MAINTENANCE_MODE:
    # Sem remount: o filesystem fica como padrao (host grava, codigo le).
    # Assim o PC pode editar/deploy os arquivos normalmente.
    print("[boot] MODO MANUTENCAO: host grava na flash (deploy/edicao).")
else:
    # Operacao normal: esconde o drive do host (assim nao ha conflito) e
    # remonta o filesystem como gravavel pelo codigo.
    storage.disable_usb_drive()
    storage.remount("/", readonly=False)
    print("[boot] Modo normal: drive oculto, flash gravavel pelo codigo.")
