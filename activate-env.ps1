$env:Path = "C:\Users\Muner\Downloads\node-v24.21.0-win-x64;C:\Users\Muner\Downloads\python-3.13.15-embed-amd64;C:\Users\Muner\Downloads\python-3.13.15-embed-amd64\Scripts;" + $env:Path
Write-Host "Ambiente ativado!" -ForegroundColor Green
Write-Host "Node:" -NoNewline; node -v
Write-Host "Python:" -NoNewline; python --version