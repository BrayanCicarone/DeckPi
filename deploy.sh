#!/usr/bin/env bash
#
# deploy.sh — Deploy do Painel de Controle para o Raspberry Pi Pico (CircuitPython).
#
# Copia o firmware (.py), settings.toml e a pasta www/ para o drive CIRCUITPY.
# Opcionalmente copia a pasta lib/ local (bibliotecas Adafruit) para /lib.
#
# IMPORTANTE: em operacao normal o boot.py desabilita o drive USB; o CIRCUITPY
# nao aparece. Para fazer deploy, ligue o jumper GP15 -> GND e ressete o Pico
# (modo manutencao). NAO apaga config.json/wifi.json/auth.json do dispositivo.
#
# Uso:
#   ./deploy.sh                       # autodetecta o CIRCUITPY
#   ./deploy.sh --include-libs        # tambem copia ./lib -> /lib
#   ./deploy.sh --clean               # limpa www/ (e lib/) antes de copiar
#   ./deploy.sh --dest /Volumes/CIRCUITPY

set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST=""
INCLUDE_LIBS=0
CLEAN=0

ROOT_FILES=(boot.py code.py wifi_mgr.py executor.py storage_cfg.py auth.py settings.toml)

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dest) DEST="$2"; shift 2 ;;
    --include-libs) INCLUDE_LIBS=1; shift ;;
    --clean) CLEAN=1; shift ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Argumento desconhecido: $1"; exit 1 ;;
  esac
done

find_circuitpy() {
  # macOS
  if [[ -d "/Volumes/CIRCUITPY" ]]; then echo "/Volumes/CIRCUITPY"; return; fi
  # Linux (varios pontos comuns de montagem)
  for base in "/media/$USER" "/run/media/$USER" "/media"; do
    if [[ -d "$base/CIRCUITPY" ]]; then echo "$base/CIRCUITPY"; return; fi
  done
}

if [[ -z "$DEST" ]]; then
  DEST="$(find_circuitpy || true)"
fi

if [[ -z "$DEST" || ! -d "$DEST" ]]; then
  echo "X  Drive CIRCUITPY nao encontrado."
  echo "   - Ligue o jumper GP15 -> GND e ressete o Pico (modo manutencao)."
  echo "   - Ou informe o destino: ./deploy.sh --dest /Volumes/CIRCUITPY"
  exit 1
fi

echo "==> Deploy do Painel de Controle"
echo "    Origem:  $SRC"
echo "    Destino: $DEST"
echo

if [[ "$CLEAN" -eq 1 ]]; then
  [[ -d "$DEST/www" ]] && { echo "--  Limpando www/"; rm -rf "$DEST/www"; }
  if [[ "$INCLUDE_LIBS" -eq 1 && -d "$DEST/lib" ]]; then
    echo "--  Limpando lib/"; rm -rf "$DEST/lib"
  fi
fi

copied=0
for f in "${ROOT_FILES[@]}"; do
  if [[ -f "$SRC/$f" ]]; then
    cp "$SRC/$f" "$DEST/"
    echo "OK  $f"
    copied=$((copied + 1))
  else
    echo "!!  $f nao encontrado (pulando)"
  fi
done

if [[ -d "$SRC/www" ]]; then
  cp -R "$SRC/www" "$DEST/"
  echo "OK  www/"
else
  echo "!!  pasta www/ nao encontrada"
fi

if [[ "$INCLUDE_LIBS" -eq 1 ]]; then
  if [[ -d "$SRC/lib" ]]; then
    cp -R "$SRC/lib" "$DEST/"
    echo "OK  lib/ (bibliotecas)"
  else
    echo "!!  --include-libs pedido, mas ./lib nao existe."
    echo "    Baixe o Adafruit CircuitPython Bundle e coloque os modulos em ./lib"
  fi
fi

# Garante que os dados foram realmente gravados antes de remover o cartao.
sync || true

echo
echo "==> Concluido. $copied arquivo(s) de firmware + www/ copiados."
echo "    Lembre de REMOVER o jumper GP15 e resetar para voltar ao modo normal."
