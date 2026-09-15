@echo off
setlocal

if "%~1"=="" (
  echo Usage: update-dashboard.cmd path-to-latest-workbook.xlsx
  exit /b 2
)

set "PYTHON_CMD=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%PYTHON_CMD%" (
  set "PYTHON_CMD="
  for %%I in (python.exe) do set "PYTHON_CMD=%%~$PATH:I"
)
if not exist "%PYTHON_CMD%" (
  echo Python 3 with openpyxl is required. See ADMIN_UPDATE.md.
  exit /b 3
)

set "NODE_CMD=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%NODE_CMD%" (
  set "NODE_CMD="
  for %%I in (node.exe) do set "NODE_CMD=%%~$PATH:I"
)
if not exist "%NODE_CMD%" (
  echo Node.js is required. See ADMIN_UPDATE.md.
  exit /b 4
)

set "ADMIN_DIR=%~dp0"
set "CACHE_FILE=%TEMP%\jt-dashboard-source.json"
set "OUTPUT_DIR=%ADMIN_DIR%generated"
set "OUTPUT_FILE=%OUTPUT_DIR%\index.html"

if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

"%PYTHON_CMD%" "%ADMIN_DIR%extract_cached_source.py" "%~f1" "%CACHE_FILE%"
if errorlevel 1 exit /b 5

set "SOURCE_CACHE=%CACHE_FILE%"
set "DASHBOARD_OUTPUT=%OUTPUT_FILE%"
"%NODE_CMD%" "%ADMIN_DIR%build-dashboard.mjs"
if errorlevel 1 exit /b 6

echo.
echo Generated: %OUTPUT_FILE%
echo Upload only this generated\index.html to the GitHub repository root.
echo Do not upload the source workbook.
endlocal
