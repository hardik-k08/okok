@echo off
setlocal enabledelayedexpansion
title RetailPulse Dashboard Server

echo ======================================================================
echo           RETAILPULSE - DEMAND FORECASTING DASHBOARD
echo ======================================================================
echo.

:: 1. Navigate to script's directory
cd /d "%~dp0"
echo [*] Working Directory: %CD%

:: 2. Resolve Python Executable
set "PYTHON_EXE="
where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYTHON_EXE=python"
) else (
    if exist "C:\Users\%USERNAME%\AppData\Local\Python\pythoncore-3.15-64\python.exe" (
        set "PYTHON_EXE=C:\Users\%USERNAME%\AppData\Local\Python\pythoncore-3.15-64\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python311\python.exe" (
        set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python311\python.exe"
    ) else if exist "%LOCALAPPDATA%\Programs\Python\Python312\python.exe" (
        set "PYTHON_EXE=%LOCALAPPDATA%\Programs\Python\Python312\python.exe"
    ) else (
        echo [ERROR] Python not found in PATH or standard installation directories.
        echo Please ensure Python 3.10+ is installed.
        pause
        exit /b 1
    )
)

echo [*] Python Runtime: %PYTHON_EXE%
%PYTHON_EXE% --version
if %errorlevel% neq 0 (
    echo [ERROR] Failed to execute Python.
    pause
    exit /b 1
)

:: 3. Free Port 8502 if previously in use
echo [*] Checking for existing processes on port 8502...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8502" ^| findstr "LISTENING"') do (
    echo [*] Terminating lingering process on port 8502 (PID: %%a)...
    taskkill /F /PID %%a >nul 2>nul
)

:: 4. Verify Dependencies
echo [*] Verifying critical dependencies...
%PYTHON_EXE% -c "import streamlit, pandas, numpy, sklearn, plotly, reportlab" >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] Installing required packages from requirements.txt...
    %PYTHON_EXE% -m pip install -r requirements.txt
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency installation failed.
        pause
        exit /b 1
    )
)

:: 5. Launch Dashboard on Port 8502
echo.
echo ======================================================================
echo   Launching RetailPulse on http://localhost:8502
echo   Press Ctrl+C in this terminal window to stop the server.
echo ======================================================================
echo.

:: Automatically open browser after 2 seconds
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:8502"

%PYTHON_EXE% -m streamlit run app.py --server.port 8502 --server.headless true

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Streamlit exited with an error code: %errorlevel%
    pause
)
