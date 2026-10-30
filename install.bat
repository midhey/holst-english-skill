@echo off
rem ---------------------------------------------------------------------------
rem  Ustanovka skilla holst-english-lesson.
rem  Obertka nad install.ps1: obhodit ExecutionPolicy ("net cifrovoy podpisi").
rem
rem    install.bat          - junction na etot klon (obnovlenie = git pull)
rem    install.bat -Copy    - nezavisimaya kopiya bez .git
rem
rem  Mozhno prosto dvazhdy kliknut po faylu v provodnike.
rem ---------------------------------------------------------------------------

setlocal

set "DIR=%~dp0"
set "PS1=%DIR%install.ps1"

if not exist "%PS1%" (
    echo ERROR: install.ps1 not found next to this file:
    echo   "%PS1%"
    echo Run install.bat from the skill folder.
    echo.
    pause
    exit /b 1
)

rem PowerShell 7, esli est; inache vstroennyy Windows PowerShell 5.1
set "PSEXE=powershell.exe"
where pwsh.exe >nul 2>&1 && set "PSEXE=pwsh.exe"

rem konsol v UTF-8, chtoby russkie soobshcheniya skripta byli chitaemymi
chcp 65001 >nul

rem snyat "metku interneta" s .ps1 (stavitsya, esli repozitoriy skachali ZIP-om)
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%DIR%' -Recurse -Filter *.ps1 -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue" >nul 2>&1

rem Proba: mozhno li voobshche zapuskat .ps1 faly s klyuchom -ExecutionPolicy?
rem Gruppovaya politika (GPO) i AppLocker perekryvayut etot klyuch, poetomu
rem proveryaem delom - vremennym skriptom, a ne Get-ExecutionPolicy (on sam
rem padaet pri zapreshchayushchey politike: ne gruzitsya modul ...Security).
set "PROBE=%TEMP%\install-probe-%RANDOM%%RANDOM%.ps1"
2>nul (>"%PROBE%" echo exit 42)
"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%PROBE%" >nul 2>&1
set "PROBERC=%ERRORLEVEL%"
del "%PROBE%" >nul 2>&1
if not "%PROBERC%"=="42" goto :blocked

"%PSEXE%" -NoProfile -ExecutionPolicy Bypass -File "%PS1%" %*
goto :done

:blocked
rem Zapusk .ps1 faylom zapreshchen politikoy. ExecutionPolicy ogranichivaet
rem imenno zapusk fayla, poetomu vypolnyaem tekst skripta cherez -Command.
echo NOTE: running scripts from files is blocked by policy - using -Command.
"%PSEXE%" -NoProfile -Command "Set-Location -LiteralPath '%DIR%'; & ([scriptblock]::Create((Get-Content -Raw -LiteralPath '%PS1%'))) %*"

:done
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" echo ERROR: install failed with exit code %RC%
pause
exit /b %RC%
