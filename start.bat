@echo off
cd /d "%~dp0"
where py >nul 2>&1
if errorlevel 1 (
    python demos\server.py %*
) else (
    py -3 demos\server.py %*
)
if errorlevel 1 pause
