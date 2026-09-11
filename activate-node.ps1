# Realizar o dowload do zip e extrair para a pasta necessária. Após isso, executar esse script .\activate-node.ps1

$env:Path = "C:\Users\Muner\Downloads\node-v24.21.0-win-x64;" + $env:Path
Write-Host "Node.js portátil ativado! Versão:" -ForegroundColor Green
node -v

# Se aparecer erro de política de execução, rode antes (não precisa de admin, vale só para essa sessão):
# Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#$env:Path = "C:\Users\Muner\Downloads\node-v24.21.0-win-x64;" + $env:Path -> o mesmo com o python
#$env:Path = "C:\Users\Muner\Downloads\python-3.13.15-embed-amd64;" + $env:Path
#$env:Path = "C:\Users\Muner\Downloads\python-3.13.15-embed-amd64\Scripts;" + $env:Path