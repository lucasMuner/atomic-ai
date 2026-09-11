# SETUP INICIAL — rodar UMA VEZ só, depois de:
#   1. extrair o node-v24.21.0-win-x64.zip      dentro de tools\
#   2. extrair o python-3.13.15-embed-amd64.zip dentro de tools\
# (o node.exe e o python.exe precisam ficar direto dentro dessas pastas,
#  não dentro de uma subpasta a mais — se o zip criar uma pasta duplicada
#  tipo tools\node-v24.21.0-win-x64\node-v24.21.0-win-x64\, mova um nível
#  pra cima antes de continuar)
#
# O que este script faz:
#   1. Libera o "import site" no Python embutido (vem desativado por
#      padrão, e sem isso o pip não funciona nem depois de instalado)
#   2. Instala o pip nesse Python, via get-pip.py
#   3. Instala as dependências do backend (requirements.txt)
#   4. Cria o backend\.env a partir do .env.example (se ainda não existir)
#   5. Instala as dependências do frontend (npm install)
#
# Se der erro de política de execução ao tentar rodar este arquivo:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# E se isso também for bloqueado (comum em laboratório com política de
# domínio), os passos abaixo podem ser feitos manualmente no cmd.exe —
# veja o comentário de cada etapa.

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$nodeDir = Join-Path $root "tools\node-v24.21.0-win-x64"
$pyDir = Join-Path $root "tools\python-3.13.15-embed-amd64"

function Fail($msg) {
    Write-Host $msg -ForegroundColor Red
    exit 1
}

Write-Host "== 1/5: checando Node e Python em tools\ ==" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
    Fail "Não achei $nodeDir\node.exe — extraia o zip do Node dentro de tools\ (veja o comentário no topo deste arquivo)."
}
if (-not (Test-Path (Join-Path $pyDir "python.exe"))) {
    Fail "Não achei $pyDir\python.exe — extraia o zip do Python dentro de tools\ (veja o comentário no topo deste arquivo)."
}
$env:Path = "$nodeDir;$pyDir;$pyDir\Scripts;" + $env:Path

Write-Host "== 2/5: liberando 'import site' no Python embutido ==" -ForegroundColor Cyan
# equivalente manual: abra o arquivo tools\python-3.13.15-embed-amd64\python313._pth
# num editor de texto e tire o "#" da linha "#import site"
$pthFile = Get-ChildItem -Path $pyDir -Filter "python3*._pth" | Select-Object -First 1
if (-not $pthFile) {
    Fail "Não achei o arquivo *._pth dentro de $pyDir — confere se o zip do Python foi extraído certo."
}
$pthContent = Get-Content $pthFile.FullName
if ($pthContent -match "^\s*#\s*import site\s*$") {
    $pthContent = $pthContent -replace "^\s*#\s*import site\s*$", "import site"
    Set-Content -Path $pthFile.FullName -Value $pthContent
    Write-Host "  'import site' liberado em $($pthFile.Name)" -ForegroundColor Green
} elseif ($pthContent -match "^\s*import site\s*$") {
    Write-Host "  'import site' já estava liberado, ok." -ForegroundColor Green
} else {
    Write-Host "  Aviso: não achei a linha '#import site' em $($pthFile.Name) — confere manualmente." -ForegroundColor Yellow
}

Write-Host "== 3/5: instalando o pip (get-pip.py) ==" -ForegroundColor Cyan
python -m pip --version *> $null
$hasPip = ($LASTEXITCODE -eq 0)
if (-not $hasPip) {
    # equivalente manual: python get-pip.py
    python (Join-Path $root "get-pip.py")
    if ($LASTEXITCODE -ne 0) { Fail "Falha ao instalar o pip com get-pip.py." }
} else {
    Write-Host "  pip já estava instalado, ok." -ForegroundColor Green
}

Write-Host "== 4/5: instalando dependências do backend ==" -ForegroundColor Cyan
# equivalente manual: cd backend ; pip install -r requirements.txt
python -m pip install -r (Join-Path $root "backend\requirements.txt")
if ($LASTEXITCODE -ne 0) { Fail "Falha ao instalar as dependências do backend (pip)." }

$envFile = Join-Path $root "backend\.env"
$envExample = Join-Path $root "backend\.env.example"
if (-not (Test-Path $envFile)) {
    Copy-Item $envExample $envFile
    Write-Host "  Criei backend\.env a partir do .env.example — abra esse arquivo e preencha as credenciais do Azure." -ForegroundColor Yellow
} else {
    Write-Host "  backend\.env já existe, não mexi nele." -ForegroundColor Green
}

Write-Host "== 5/5: instalando dependências do frontend (pode demorar) ==" -ForegroundColor Cyan
# equivalente manual: cd frontend ; npm install
Push-Location (Join-Path $root "frontend")
npm install
$npmExit = $LASTEXITCODE
Pop-Location
if ($npmExit -ne 0) { Fail "Falha ao instalar as dependências do frontend (npm install)." }

Write-Host ""
Write-Host "Setup concluído!" -ForegroundColor Green
Write-Host "Próximos passos:"
Write-Host "  1. Preencha backend\.env com os dados do seu recurso Azure OpenAI"
Write-Host "  2. Em um terminal: .\activate-env.ps1  ->  cd backend  ->  uvicorn main:app --reload --port 8000"
Write-Host "  3. Em outro terminal: .\activate-env.ps1  ->  cd frontend  ->  npm run dev"