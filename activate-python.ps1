$env:Path = "C:\Users\Muner\Downloads\python-3.13.15-embed-amd64;C:\Users\Muner\Downloads\python-3.13.15-embed-amd64\Scripts;" + $env:Path
Write-Host "Python portátil ativado! Versão:" -ForegroundColor Green
python --version
pip --version