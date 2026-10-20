@echo off
setlocal
cd /d "%~dp0"
set "PORT=1420"
set "HOST=127.0.0.1"
set "APP_ORIGIN=http://127.0.0.1:1420"
set "DATABASE_PATH=%~dp0data\mentor.sqlite"
set "MENTOR_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "%MENTOR_NODE%" set "MENTOR_NODE=node"
if not exist "dist\index.html" (
  echo Falta compilar la interfaz. Ejecuta pnpm build en esta carpeta.
  pause
  exit /b 1
)
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:1420/api/health' -TimeoutSec 2; if ($r.StatusCode -eq 200 -and ($r.Content | ConvertFrom-Json).ok) { exit 0 } } catch {}; exit 1" >nul 2>&1
if not errorlevel 1 (
  start "" "http://127.0.0.1:1420/"
  exit /b 0
)
echo Iniciando Mentor en http://127.0.0.1:1420/
echo Deja esta ventana abierta mientras uses la plataforma.
start "" powershell -NoProfile -WindowStyle Hidden -Command "for ($i=0; $i -lt 30; $i++) { try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:1420/api/health' -TimeoutSec 1; if ($r.StatusCode -eq 200) { Start-Process 'http://127.0.0.1:1420/'; exit } } catch {}; Start-Sleep -Milliseconds 500 }"
"%MENTOR_NODE%" server/index.mjs
echo.
echo El servidor de Mentor se ha detenido.
pause
