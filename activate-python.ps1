# ATIVA O PYTHON PORTÁTIL PARA ESTA SESSÃO DO POWERSHELL
#
# Pré-requisito (fazer uma vez só): baixe o zip
# "python-3.13.15-embed-amd64.zip" em https://www.python.org/downloads/windows/
# ("Windows embeddable package (64-bit)") e extraia dentro da pasta "tools",
# na raiz deste projeto, ficando assim:
#   atomic-ai-main\tools\python-3.13.15-embed-amd64\python.exe
#
# IMPORTANTE — o Python "embeddable" vem com o pip desativado por padrão.
# Antes de instalar qualquer pacote, rode uma vez: .\setup.ps1
# (ele libera o pip e já instala as dependências do backend).
#
# Depois é só rodar (nesta pasta): .\activate-python.ps1

$pyDir = Join-Path $PSScriptRoot "tools\python-3.13.15-embed-amd64"

if (-not (Test-Path (Join-Path $pyDir "python.exe"))) {
    Write-Host "Não achei o Python em: $pyDir" -ForegroundColor Red
    Write-Host "Baixe o python-3.13.15-embed-amd64.zip e extraia dentro de tools\ (veja o comentário no topo deste arquivo)." -ForegroundColor Yellow
    return
}

$env:Path = "$pyDir;$pyDir\Scripts;" + $env:Path
Write-Host "Python portátil ativado! Versão:" -ForegroundColor Green
python --version
python -m pip --version