@echo off
echo Starting NexusRAG Platform...
start "NexusRAG Backend (Port 8080)" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0run-backend.ps1"
start "NexusRAG Frontend (Port 5173)" powershell -NoExit -ExecutionPolicy Bypass -File "%~dp0run-frontend.ps1"
echo Both servers have been launched!
echo Frontend will be available at: http://localhost:5173
echo Backend will be available at:  http://localhost:8080
pause
