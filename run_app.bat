@echo off
title Placement Readiness Copilot - MSOT Desktop PC Edition
cls
echo ======================================================================
echo          PLACEMENT READINESS COPILOT - PC DESKTOP APPLICATION
echo                      MSOT Campus Edition v2.5
echo ======================================================================
echo.
echo [1/3] Checking Node.js environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in system PATH.
    echo Please install Node.js from https://nodejs.org/ and retry.
    pause
    exit /b 1
)

echo [2/3] Launching Placement Copilot in Standalone Desktop App Window...
timeout /t 1 >nul

:: Attempt launching in Native Application Window Mode (Edge or Chrome without browser chrome)
where msedge >nul 2>nul
if %errorlevel% equ 0 (
    start "" msedge --app="http://localhost:5000" --window-size=1440,920 --window-position=50,50
    goto RUN_SERVER
)

where chrome >nul 2>nul
if %errorlevel% equ 0 (
    start "" chrome --app="http://localhost:5000" --window-size=1440,920 --window-position=50,50
    goto RUN_SERVER
)

:: Fallback to default browser
start "" "http://localhost:5000"

:RUN_SERVER
echo [3/3] Placement Copilot Engine running on port 5000...
node server.js

pause
