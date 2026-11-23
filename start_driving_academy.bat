@echo off
title DRIVE SMART – 3D Beginner Driving Academy
echo =======================================================
echo   DRIVE SMART - 3D Beginner Driving Academy Simulator
echo =======================================================
echo.

:: Check if port 8000 is already active
netstat -ano | findstr ":8000" | findstr "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo Local web server is already running on port 8000.
) else (
    echo Starting local web server on port 8000...
    start /b python -m http.server 8000 --directory "%~dp0drive_smart" >nul 2>&1
    timeout /t 1 >nul
)

echo Opening game in your browser: http://localhost:8000/
echo.

:: Open Google Chrome or default browser
start "" "http://localhost:8000/"

echo Game launched! Enjoy driving.
timeout /t 2 >nul
exit
