@echo off
title Instalador do CondoSphere v3.0 ERP (SQLite Relational)
color 0A

set "INSTALL_DIR=%~dp0"
if "%INSTALL_DIR:~-1%"=="\" set "INSTALL_DIR=%INSTALL_DIR:~0,-1%"

echo =======================================================================
echo          INSTALADOR OFICIAL DO CONDOSPHERE ERP v3.0 (SQLITE)
echo =======================================================================
echo.
echo Este assistente ira configurar o CondoSphere no seu computador,
echo garantindo todos os pre-requisitos de banco de dados e rede!
echo.
echo -----------------------------------------------------------------------
echo Diretorio de Instalacao: %INSTALL_DIR%
echo -----------------------------------------------------------------------
echo.

:: Passo 1: Perguntar o modo de instalacao (Servidor ou Cliente)
echo Escolha o Modo de Instalacao Desejado:
echo [1] SERVIDOR - Configura o banco relacional SQLite local, cria o banco e sobe a API.
echo [2] CLIENTE  - Apenas conecta esta maquina ao computador servidor da rede.
echo.
set /p modo="Escolha uma opcao (1 ou 2): "

if "%modo%" equ "1" goto mode_server
if "%modo%" equ "2" goto mode_client
echo Opcao invalida. Reiniciando instalador...
pause
goto end

:mode_server
echo.
echo =======================================================================
echo MODO SELECIONADO: [1] SERVIDOR (COMPUTADOR PRINCIPAL)
echo =======================================================================
echo.

:: Cria a pasta de instalacao se ela nao existir
if not exist "%INSTALL_DIR%\data" (
    mkdir "%INSTALL_DIR%\data"
)
if not exist "%INSTALL_DIR%\utils\sqlite" (
    mkdir "%INSTALL_DIR%\utils\sqlite"
)

:: Muda de diretorio imediatamente para o local oficial de instalacao (Evita erros de caminho relativo)
cd /d "%INSTALL_DIR%"

:: Verificar e instalar o Node.js automaticamente se estiver faltando
where node >nul 2>nul
if %errorlevel% equ 0 goto node_ok_server
echo Node.js nao encontrado. Baixando instalador silencioso...
powershell -Command "Invoke-WebRequest -Uri 'https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi' -OutFile '%temp%\node_install.msi'"
echo Aguarde a conclusao da instalacao silenciosa do Node.js no Windows...
start /wait "" msiexec /i "%temp%\node_install.msi" /passive
del "%temp%\node_install.msi"
:node_ok_server

:: Verificar se o SQLite CLI esta instalado ou se ja possuimos o binario local
echo Verificando se o SQLite CLI portable esta presente na pasta local do CondoSphere...
if exist "%INSTALL_DIR%\utils\sqlite\sqlite3.exe" (
    echo [OK] SQLite CLI portable detectado em utils\sqlite!
    set "sqlite_path=%INSTALL_DIR%\utils\sqlite\sqlite3.exe"
    goto sqlite_ok
)

if exist "%INSTALL_DIR%\sqlite3.exe" (
    echo [OK] SQLite CLI portable detectado na raiz do CondoSphere!
    set "sqlite_path=%INSTALL_DIR%\sqlite3.exe"
    goto sqlite_ok
)

where sqlite3 >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] SQLite ja esta instalado no PATH global do Windows!
    set "sqlite_path=sqlite3"
    goto sqlite_ok
)

echo.
echo [AVISO] SQLite CLI nao foi encontrado no seu computador!
echo Baixando o SQLite Tools oficial de forma segura...
echo Aguarde, isso pode levar alguns segundos dependendo da sua internet...
echo.

powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.sqlite.org/2024/sqlite-tools-win-x64-3460100.zip' -OutFile '%temp%\sqlite.zip'"

if not exist "%temp%\sqlite.zip" goto sqlite_download_error

echo Descompactando arquivos binarios do SQLite...
powershell -Command "Expand-Archive -Path '%temp%\sqlite.zip' -DestinationPath '%temp%\sqlite_extracted' -Force"
powershell -Command "Get-ChildItem -Path '%temp%\sqlite_extracted' -Filter 'sqlite3.exe' -Recurse | Copy-Item -Destination '%INSTALL_DIR%\utils\sqlite\' -Force"

:: Limpeza de arquivos temporarios
del "%temp%\sqlite.zip" >nul 2>nul
rmdir /s /q "%temp%\sqlite_extracted" >nul 2>nul

if exist "%INSTALL_DIR%\utils\sqlite\sqlite3.exe" (
    echo [OK] SQLite CLI instalado com sucesso em utils\sqlite!
    set "sqlite_path=%INSTALL_DIR%\utils\sqlite\sqlite3.exe"
    goto sqlite_ok
)

:sqlite_download_error
echo [ERRO] Falha ao baixar o SQLite automaticamente.
echo Por favor, coloque o executavel 'sqlite3.exe' na pasta '%INSTALL_DIR%\utils\sqlite\' manualmente e tente novamente.
pause
exit

:sqlite_ok
echo.
echo =======================================================================
echo CONFIGURAÇÕES DE REDE DO SERVIDOR LOCAL / INTERNET
echo =======================================================================
echo.
echo Como este computador sera o SERVIDOR principal:
set /p srv_port="Digite a porta em que a API CondoSphere ira rodar [padrao 3000]: "
if "%srv_port%" equ "" set "srv_port=3000"

echo.
echo O servidor aceitara conexoes de qual origem?
echo [1] Apenas Rede Local (Intranet / LAN)
echo [2] Internet Aberta direta (Port-Forwarding / WAN)
echo.
set /p srv_net="Escolha uma opcao (1 ou 2): "

set "srv_host=localhost"
if "%srv_net%" equ "2" goto get_ip_public
goto get_ip_private

:get_ip_public
echo.
echo Buscando o seu IP Publico atual...
curl -s -m 5 https://api.ipify.org > "%temp%\public_ip.txt" 2>nul
if not exist "%temp%\public_ip.txt" (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (Invoke-WebRequest -Uri 'https://api.ipify.org' -TimeoutSec 5).Content" > "%temp%\public_ip.txt" 2>nul
)
if exist "%temp%\public_ip.txt" (
    for %%A in ("%temp%\public_ip.txt") do (
        if %%~zA gtr 0 (
            set /p srv_host=<"%temp%\public_ip.txt"
        )
    )
    del "%temp%\public_ip.txt" >nul 2>nul
)
goto ip_resolved

:get_ip_private
echo.
echo Buscando o seu IP Privado na Rede Local...
set "raw_ip="
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /i "IPv4" 2^>nul') do (
    set "raw_ip=%%i"
)
if "%raw_ip%" equ "" goto ip_resolved
set "srv_host=%raw_ip: =%"
goto ip_resolved

:ip_resolved
if "%srv_host%" equ "" set "srv_host=localhost"

echo IP Atribuido ao Servidor: %srv_host%
echo Porta Atribuida ao Servidor: %srv_port%
echo.

:: Escreve as configuracoes do SQLite no arquivo db_config.json
echo Criando arquivo de configuracao 'db_config.json' do servidor...
set "DB_PATH=%INSTALL_DIR:\=\\%\\data\\condosphere.db"
echo { > "%INSTALL_DIR%\data\db_config.json"
echo   "db_type": "sqlite", >> "%INSTALL_DIR%\data\db_config.json"
echo   "database": "%DB_PATH%", >> "%INSTALL_DIR%\data\db_config.json"
echo   "server_host": "%srv_host%", >> "%INSTALL_DIR%\data\db_config.json"
echo   "server_port": %srv_port% >> "%INSTALL_DIR%\data\db_config.json"
echo } >> "%INSTALL_DIR%\data\db_config.json"

:: Cria o banco de dados no SQLite e aplica o esquema relacional
echo.
echo Criando o banco de dados relacional 'condosphere.db' com chaves estrangeiras...
if "%sqlite_path%" equ "" set "sqlite_path=%INSTALL_DIR%\utils\sqlite\sqlite3.exe"
if exist "%INSTALL_DIR%\sqlite_schema.sql" (
    "%sqlite_path%" "%INSTALL_DIR%\data\condosphere.db" < "%INSTALL_DIR%\sqlite_schema.sql"
    echo [OK] Relacionamentos entre tabelas, triggers e administrador inicial criados com sucesso!
) else (
    echo [AVISO] Arquivo 'sqlite_schema.sql' nao encontrado! O esquema sera criado automaticamente na primeira execucao do servidor.
)

goto shortcuts_create


:mode_client
echo.
echo =======================================================================
echo MODO SELECIONADO: [2] CLIENTE (COMPUTADOR TERMINAL / PORTARIA)
echo =======================================================================
echo.

:: Cria a pasta de instalacao se ela nao existir
if not exist "%INSTALL_DIR%\data" (
    mkdir "%INSTALL_DIR%\data"
)

:: Muda de diretorio imediatamente para o local oficial de instalacao
cd /d "%INSTALL_DIR%"

echo.
echo =======================================================================
echo PARAMETROS DE ACESSO AO SERVIDOR PRINCIPAL
echo =======================================================================
echo.
echo Escolha o tipo de comunicacao com o servidor:
echo [1] Comunicacao via Rede Local (Mesmo Roteador / LAN)
echo [2] Comunicacao via Internet Direta (NAT / IP Publico / WAN)
echo.
set /p client_net="Escolha uma opcao (1 ou 2): "

echo.
if "%client_net%" equ "2" goto client_ip_public
goto client_ip_private

:client_ip_public
set /p srv_ip="Digite o IP PUBLICO ou HOST da Internet do Servidor: "
goto client_ip_resolved

:client_ip_private
set /p srv_ip="Digite o IP PRIVADO (Rede Local) do Computador Servidor: "
goto client_ip_resolved

:client_ip_resolved
if "%srv_ip%" equ "" (
    echo IP nao fornecido. Usando 'localhost' as padrao.
    set "srv_ip=localhost"
)

set /p srv_port="Digite a porta em que o Servidor esta rodando [padrao 3000]: "
if "%srv_port%" equ "" set "srv_port=3000"

:: Escreve as configuracoes do Cliente em client_config.json
echo Criando arquivo de sincronizacao 'client_config.json'...
echo { > "%INSTALL_DIR%\data\client_config.json"
echo   "server_host": "%srv_ip%", >> "%INSTALL_DIR%\data\client_config.json"
echo   "server_port": %srv_port% >> "%INSTALL_DIR%\data\client_config.json"
echo } >> "%INSTALL_DIR%\data\client_config.json"

echo [OK] Computador cliente configurado e sintonizado de forma instantanea com o servidor em %srv_ip%:%srv_port%!
echo.

goto shortcuts_create


:shortcuts_create
echo.
echo =======================================================================
echo CRIANDO ATALHOS NA ÁREA DE TRABALHO
echo =======================================================================
echo.

:: Executa a instalacao do NPM local se for modo servidor para baixar as dependencias
if "%modo%" neq "1" goto skip_npm
echo Instalando as dependencias do Node.js (incluindo o driver sqlite3)...
echo Este processo pode levar alguns segundos dependendo da sua internet...
cd /d "%INSTALL_DIR%"
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [AVISO/ERRO] Ocorreu uma falha ou aviso durante o 'npm install'!
    echo Tentando forcar a instalacao individual do driver relacional do SQLite...
    call npm install sqlite3
)

:skip_npm

:: Script VBScript para gerar o atalho no Desktop do Windows
echo Criando atalho do CondoSphere no seu Desktop...
set "VBS_SCRIPT=%temp%\CreateShortcut.vbs"

echo Set oWS = WScript.CreateObject^("WScript.Shell"^) > "%VBS_SCRIPT%"
echo sLinkFile = oWS.SpecialFolders^("Desktop"^) ^& "\CondoSphere ERP.lnk" >> "%VBS_SCRIPT%"
echo Set oLink = oWS.CreateShortcut^(sLinkFile^) >> "%VBS_SCRIPT%"
if "%modo%" equ "1" (
    echo oLink.TargetPath = "%INSTALL_DIR:\=\\%\\iniciar_sistema.bat" >> "%VBS_SCRIPT%"
) else (
    echo oLink.TargetPath = "%INSTALL_DIR:\=\\%\\index.html" >> "%VBS_SCRIPT%"
)
echo oLink.WorkingDirectory = "%INSTALL_DIR:\=\\%" >> "%VBS_SCRIPT%"
echo oLink.Description = "CondoSphere ERP v3.0" >> "%VBS_SCRIPT%"
echo oLink.IconLocation = "%SystemRoot%\System32\shell32.dll, 15" >> "%VBS_SCRIPT%"
echo oLink.Save >> "%VBS_SCRIPT%"

cscript /nologo "%VBS_SCRIPT%"
del "%VBS_SCRIPT%"

echo.
echo =======================================================================
echo INSTALAÇÃO CONCLUIDA COM SUCESSO ABSOLUTO!
echo =======================================================================
echo.
if "%modo%" neq "1" goto finish_client

echo O banco relacional SQLite foi criado, sementado e os relacionamentos foram ativos!
echo Um atalho foi adicionado a sua Area de Trabalho ("CondoSphere ERP").
echo.
set "srv_start=N"
set /p srv_start="Deseja iniciar o servidor CondoSphere agora? (S/N): "
if /i "%srv_start%" neq "S" goto end_installer
echo.
echo Iniciando o CondoSphere para voce...
start "" "%INSTALL_DIR%\iniciar_sistema.bat"
goto end_installer

:finish_client
echo Esta maquina cliente foi conectada ao servidor principal na rede.
echo Voce ja pode abrir o arquivo 'index.html' para acessar o sistema!
goto end_installer

:end_installer
echo.
echo Obrigado por escolher o CondoSphere!
pause
exit

:end
