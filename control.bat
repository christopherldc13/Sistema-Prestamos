@echo off
set PORT=3000

:menu
cls
echo ===================================
echo     Control Sistema de Prestamos
echo ===================================
echo 1. Iniciar Proyecto (npm run dev)
echo 2. Detener Proyecto (Puerto %PORT%)
echo 3. Salir
echo ===================================
set /p option="Elige una opcion (1-3): "

if "%option%"=="1" goto start
if "%option%"=="2" goto stop
if "%option%"=="3" goto end
goto menu

:start
echo Iniciando el proyecto...
start "SistemaPrestamos" cmd /k "npm run dev"
echo Proyecto iniciado en una nueva ventana.
pause
goto menu

:stop
echo Buscando procesos en el puerto %PORT%...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    echo Deteniendo proceso con PID: %%a
    taskkill /F /PID %%a
)
echo Proyecto detenido.
pause
goto menu

:end
exit
