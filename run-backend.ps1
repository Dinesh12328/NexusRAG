# Load .env variables and start Spring Boot backend
$envFile = Join-Path $PSScriptRoot "ragplatform\.env"

if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile..." -ForegroundColor Cyan
    Get-Content $envFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
} else {
    Write-Warning ".env file not found at $envFile"
}

Write-Host "Starting Spring Boot RAG Backend on port 8080..." -ForegroundColor Green
Set-Location (Join-Path $PSScriptRoot "ragplatform")
mvn spring-boot:run
