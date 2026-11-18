@echo off
title VitrinaSpot - Plataforma Comercial
color 0E
echo =======================================================
echo          INICIANDO PLATAFORMA VITRINASPOT
echo       Tu vitrina digital, directo a WhatsApp
echo =======================================================
echo.

set "PATH=C:\Users\Admin\.tools\node;%PATH%"
cd /d "%~dp0"

echo [1/2] Iniciando Servidor de VitrinaSpot en puerto 4000...
start "VitrinaSpot Server" cmd /k "node server/index.js"

timeout /t 3 /nobreak > nul

echo [2/2] Abriendo VitrinaSpot en tu navegador...
start http://localhost:4000

echo.
echo =======================================================
echo  VitrinaSpot esta ejecutandose con exito!
echo  Direccion Local: http://localhost:4000
echo.
echo  Tu proyecto y base de datos son 100%% tuyos y funcionan
echo  de forma independiente en tu computador.
echo =======================================================
echo.
pause
