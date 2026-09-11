# ATIVA O NODE PORTÁTIL PARA ESTA SESSÃO DO POWERSHELL
#
# Pré-requisito (fazer uma vez só): baixe o zip "node-v24.21.0-win-x64.zip"
# em https://nodejs.org/en/download e extraia dentro da pasta "tools",
# na raiz deste projeto, ficando assim:
#   atomic-ai-main\tools\node-v24.21.0-win-x64\node.exe
#
# Depois é só rodar (nesta pasta): .\activate-node.ps1
#
# Se aparecer erro de "política de execução" ao rodar o script, rode antes
# (não precisa de admin, vale só pra essa janela do PowerShell):
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#
# Se até o Set-ExecutionPolicy for bloqueado (comum em laboratório com
# política de domínio), pule os .ps1 e ative manualmente no cmd.exe:
#   set PATH=%CD%\tools\node-v24.21.0-win-x64;%PATH%

$nodeDir = Join-Path $PSScriptRoot "tools\node-v24.21.0-win-x64"

if (-not (Test-Path (Join-Path $nodeDir "node.exe"))) {
    Write-Host "Não achei o Node em: $nodeDir" -ForegroundColor Red
    Write-Host "Baixe o node-v24.21.0-win-x64.zip e extraia dentro de tools\ (veja o comentário no topo deste arquivo)." -ForegroundColor Yellow
    return
}

$env:Path = "$nodeDir;" + $env:Path
Write-Host "Node.js portátil ativado! Versão:" -ForegroundColor Green
node -v
npm -v