Write-Host "Starting NexusRAG Frontend on port 5173..." -ForegroundColor Green
Set-Location (Join-Path $PSScriptRoot "ragplatform-ui")
npm run dev
