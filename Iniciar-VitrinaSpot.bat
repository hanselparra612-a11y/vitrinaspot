@echo off
title VitrinaSpot - Servidor y Tunel
echo ========================================================
echo         INICIANDO PLATAFORMA COMERCIAL VITRINASPOT
echo ========================================================
echo.
cd /d "C:\Users\Admin\Documents\VitrinaSpot"
set PATH=C:\Users\Admin\.tools\node;%PATH%

echo [1/2] Iniciando Servidor Node.js...
start "VitrinaSpot Server" cmd /k "set PATH=C:\Users\Admin\.tools\node;%PATH% && node server/index.js"

timeout /t 3 /nobreak >nul

echo [2/2] Iniciando Tunel Cloudflare...
start "VitrinaSpot Tunel" cmd /k "cloudflared.exe tunnel --url http://127.0.0.1:4000"

echo.
echo ========================================================
echo   VitrinaSpot esta en linea y funcionando 100%!
echo ========================================================
