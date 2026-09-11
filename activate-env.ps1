# ATIVA NODE + PYTHON PORTÁTEIS PARA ESTA SESSÃO DO POWERSHELL
# (roda os dois scripts de ativação de uma vez)
#
# Rode sempre que abrir um PowerShell novo pra trabalhar no projeto.
# Antes disso, na primeira vez, rode .\setup.ps1 (só uma vez).

& (Join-Path $PSScriptRoot "activate-node.ps1")
& (Join-Path $PSScriptRoot "activate-python.ps1")

Write-Host ""
Write-Host "Ambiente ativado!" -ForegroundColor Green