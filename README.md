# Painel de Controle — Macropad por software (Raspberry Pi Pico 2 W)

Transforma um **Raspberry Pi Pico 2 W** num "teclado fantasma": ele fica plugado no PC como
**teclado USB (HID)** e digita texto, dispara atalhos, abre programas e controla mídia. Tudo é
configurado por um **painel web** hospedado pelo próprio Pico via WiFi.

O gatilho é o **clique no painel** (navegador, no PC ou no celular). Não há botões físicos.

## Como funciona

```
Browser  ──WiFi/HTTP──►  Pico 2 W (servidor + config)  ──USB HID──►  PC alvo
```

- O Pico entra na sua rede WiFi e serve o painel + uma API JSON.
- A configuração (perfis → grupos → botões → passos) fica em `config.json` na flash.
- Clicar num botão chama `POST /api/execute`, e o Pico executa fisicamente via USB.

## Estrutura

| Arquivo            | Função |
|--------------------|--------|
| `boot.py`          | Habilita HID; desabilita o drive USB p/ o código gravar na flash. Jumper GP15→GND = modo manutenção. |
| `code.py`          | Sobe a rede (station ou AP de setup) e o servidor HTTP/API. |
| `wifi_mgr.py`      | Conecta com `wifi.json`; em falha sobe o AP `ControlPainel-Setup`. |
| `executor.py`      | Executa os passos via HID (text, combo, delay, media, launch). |
| `storage_cfg.py`   | Carrega/salva `config.json` (com config padrão). |
| `auth.py`          | Senha (hash salgado) + token de sessão. |
| `www/`             | Painel: `index.html`, `login.html`, `setup.html`, `app.js`, `style.css`. |
| `settings.toml`    | Parâmetros fixos (sem senha de rede). |

Arquivos gerados em runtime na flash: `config.json`, `wifi.json`, `auth.json`.

## Instalação

1. **CircuitPython:** segure **BOOTSEL** e plugue o Pico → some a unidade `RPI-RP2`. Copie o
   **UF2 do CircuitPython para Raspberry Pi Pico 2 W** (em circuitpython.org). A unidade
   `CIRCUITPY` aparece.
2. **Bibliotecas:** baixe o **Adafruit CircuitPython Bundle** (versão da sua CircuitPython) e
   copie para `CIRCUITPY/lib/`:
   - `adafruit_httpserver`
   - `adafruit_hid`
   - `adafruit_connection_manager`
   - `adafruit_hashlib` *(apenas se a sua CircuitPython não tiver `hashlib` nativo)*
3. **Projeto:** copie para a raiz do `CIRCUITPY`: `boot.py`, `code.py`, `settings.toml`,
   os módulos `.py` (`wifi_mgr`, `executor`, `storage_cfg`, `auth`) e a pasta `www/`.
4. **Reset.** O Pico reinicia em modo normal (o drive USB some).

## Deploy automatizado

Há scripts que detectam o drive `CIRCUITPY` e copiam tudo (firmware + `www/`):

```powershell
# Windows (PowerShell)
.\deploy.ps1                 # autodetecta o drive
.\deploy.ps1 -IncludeLibs    # também copia ./lib -> /lib
.\deploy.ps1 -Clean          # remove www/ antigo antes de copiar
```

```bash
# macOS / Linux
./deploy.sh                  # autodetecta o drive
./deploy.sh --include-libs   # também copia ./lib -> /lib
./deploy.sh --clean
```

- O deploy só funciona em **modo manutenção** (jumper **GP15→GND** + reset), quando o
  `CIRCUITPY` está visível. No modo normal o drive fica escondido.
- Os scripts **não apagam** `config.json`, `wifi.json` nem `auth.json` do dispositivo.
- Para usar `-IncludeLibs`/`--include-libs`, crie uma pasta `lib/` no projeto com os módulos do
  **Adafruit CircuitPython Bundle** (`adafruit_httpserver`, `adafruit_hid`,
  `adafruit_connection_manager` e, se necessário, `adafruit_hashlib`). Essa pasta é só para
  deploy e pode ser ignorada pelo git.

## Primeiro uso

1. Sem `wifi.json`, o Pico sobe o WiFi **`ControlPainel-Setup`** (senha `controlpainel`).
2. Conecte o celular/PC nessa rede e abra `http://192.168.4.1` → informe SSID e senha da sua
   rede → o Pico salva e **reinicia**.
3. Ele conecta na sua rede. Veja o **IP** no monitor serial (Mu, PuTTY, `tio`...).
4. Abra `http://<IP-do-Pico>` no navegador. No **primeiro acesso**, defina a senha do painel.
5. Crie perfis (um por SO: Windows/macOS), grupos (por software/categoria) e macros.

## Modo manutenção (editar o firmware)

Em operação normal o drive USB fica **desabilitado** para o código poder gravar na flash. Para
editar os arquivos pelo PC, ligue um **jumper de GP15 ao GND** e ressete: o `CIRCUITPY`
reaparece. Remova o jumper e ressete para voltar ao normal.

## Multiplataforma (Windows + Mac)

O firmware é o mesmo nos dois. As diferenças de SO são resolvidas por **perfis separados**:
cada perfil tem um campo `os` (`windows`/`mac`). O passo **Abrir programa** (`launch`) se
adapta — tecla **Win** + busca no Windows; **Cmd+Espaço** (Spotlight) no Mac. Combos você
monta com a tecla certa (`CTRL` no Windows, `GUI`/Cmd no Mac).

## Segurança

- Acesso ao painel protegido por **senha** (hash salgado na flash) + token de sessão.
- Tráfego em **HTTP** (sem TLS — inviável no Pico). Adequado a uma **rede doméstica confiável**;
  qualquer pessoa com a senha e na mesma rede pode disparar comandos.

## Passos de macro suportados

| Tipo     | Descrição |
|----------|-----------|
| `text`   | Digita uma string (layout US; ASCII confiável). |
| `combo`  | Teclas em conjunto, ex.: `CTRL+C`, `ALT+TAB`. |
| `delay`  | Pausa em milissegundos. |
| `media`  | Volume, mute, play/pause, faixa anterior/próxima. |
| `launch` | Abre um programa (sequência de teclas conforme o SO do perfil). |

## Notas / evolução

- Layout **US** por padrão. Acentos PT são limitados — um layout **BR ABNT2** pode ser
  adicionado depois.
- Reordenar perfis/grupos/botões por arrastar é uma melhoria futura (hoje há CRUD completo e
  reordenação dos passos por setas).
