<#
.SYNOPSIS
    Faz deploy do Painel de Controle para o Raspberry Pi Pico (CircuitPython).

.DESCRIPTION
    Copia o firmware (.py), o settings.toml e a pasta www/ para o drive CIRCUITPY.
    Opcionalmente copia a pasta lib/ local (bibliotecas Adafruit) para /lib no Pico.

    IMPORTANTE: em operacao normal o boot.py desabilita o drive USB, entao o
    CIRCUITPY nao aparece. Para fazer deploy, ligue o jumper GP15 -> GND e
    ressete o Pico (modo manutencao); o drive volta a aparecer.

    NAO apaga arquivos de runtime do dispositivo (config.json, wifi.json,
    auth.json) — apenas adiciona/atualiza os arquivos do projeto.

.PARAMETER Destination
    Caminho do drive CIRCUITPY (ex.: "E:\"). Se omitido, e detectado pelo rotulo.

.PARAMETER IncludeLibs
    Tambem copia a pasta local lib/ para CIRCUITPY/lib/.

.PARAMETER Clean
    Remove www/ (e lib/, se -IncludeLibs) no destino antes de copiar, evitando
    arquivos orfaos de versoes anteriores.

.EXAMPLE
    .\deploy.ps1
    .\deploy.ps1 -IncludeLibs -Clean
    .\deploy.ps1 -Destination "F:\"
#>

[CmdletBinding()]
param(
    [string]$Destination,
    [switch]$IncludeLibs,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
$src = $PSScriptRoot

# Arquivos do firmware (raiz) a copiar.
$rootFiles = @(
    "boot.py",
    "code.py",
    "wifi_mgr.py",
    "executor.py",
    "storage_cfg.py",
    "auth.py",
    "settings.toml"
)

function Find-CircuitPyDrive {
    $vol = Get-Volume -FileSystemLabel "CIRCUITPY" -ErrorAction SilentlyContinue
    if ($vol -and $vol.DriveLetter) {
        return "$($vol.DriveLetter):\"
    }
    return $null
}

# --- Resolve o destino ---------------------------------------------------
if (-not $Destination) {
    $Destination = Find-CircuitPyDrive
}

if (-not $Destination -or -not (Test-Path $Destination)) {
    Write-Host "X  Drive CIRCUITPY nao encontrado." -ForegroundColor Red
    Write-Host "   - Ligue o jumper GP15 -> GND e ressete o Pico (modo manutencao)." -ForegroundColor Yellow
    Write-Host "   - Ou informe o drive: .\deploy.ps1 -Destination 'E:\'" -ForegroundColor Yellow
    exit 1
}

Write-Host "==> Deploy do Painel de Controle" -ForegroundColor Cyan
Write-Host "    Origem:  $src"
Write-Host "    Destino: $Destination"
Write-Host ""

# --- Limpeza opcional ----------------------------------------------------
if ($Clean) {
    $wwwDest = Join-Path $Destination "www"
    if (Test-Path $wwwDest) {
        Write-Host "--  Limpando www/ no destino..." -ForegroundColor DarkYellow
        Remove-Item $wwwDest -Recurse -Force
    }
    if ($IncludeLibs) {
        $libDest = Join-Path $Destination "lib"
        if (Test-Path $libDest) {
            Write-Host "--  Limpando lib/ no destino..." -ForegroundColor DarkYellow
            Remove-Item $libDest -Recurse -Force
        }
    }
}

# --- Copia arquivos da raiz ----------------------------------------------
$copied = 0
foreach ($f in $rootFiles) {
    $path = Join-Path $src $f
    if (Test-Path $path) {
        Copy-Item $path -Destination $Destination -Force
        Write-Host ("OK  {0}" -f $f) -ForegroundColor Green
        $copied++
    } else {
        Write-Host ("!!  {0} nao encontrado (pulando)" -f $f) -ForegroundColor Yellow
    }
}

# --- Copia www/ ----------------------------------------------------------
$wwwSrc = Join-Path $src "www"
if (Test-Path $wwwSrc) {
    Copy-Item $wwwSrc -Destination $Destination -Recurse -Force
    $n = (Get-ChildItem $wwwSrc -File -Recurse).Count
    Write-Host ("OK  www/ ({0} arquivos)" -f $n) -ForegroundColor Green
} else {
    Write-Host "!!  pasta www/ nao encontrada" -ForegroundColor Yellow
}

# --- Copia lib/ (opcional) ----------------------------------------------
if ($IncludeLibs) {
    $libSrc = Join-Path $src "lib"
    if (Test-Path $libSrc) {
        Copy-Item $libSrc -Destination $Destination -Recurse -Force
        Write-Host "OK  lib/ (bibliotecas)" -ForegroundColor Green
    } else {
        Write-Host "!!  -IncludeLibs pedido, mas pasta lib/ local nao existe." -ForegroundColor Yellow
        Write-Host "    Baixe o Adafruit CircuitPython Bundle e coloque os modulos em ./lib" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==> Concluido. $copied arquivo(s) de firmware + www/ copiados." -ForegroundColor Cyan
Write-Host "    Lembre de REMOVER o jumper GP15 e resetar para voltar ao modo normal." -ForegroundColor Yellow
