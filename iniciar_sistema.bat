@echo off
title CondoSphere v3.0 - Inicializador de Ambiente Híbrido
color 0B

echo =======================================================================
echo           CONDOSPHERE - ERP COMUNITÁRIO E PORTARIA INTELIGENTE
echo =======================================================================
echo.

:: Força a pasta do script como a pasta de execução atual
cd /d "%~dp0"

set "modo=OFFLINE"
set "db_type=json"
set "srv_host=localhost"
set "srv_port=3000"

:: 1. Verificar se o sistema foi instalado e identificar o Modo (Servidor ou Cliente)
if exist "data\db_config.json" goto set_modo_server
if exist "data\client_config.json" goto set_modo_client

echo [AVISO] Nenhuma configuracao anterior foi encontrada!
echo O CondoSphere iniciara em Modo Offline de Seguranca (Cache Local).
echo DICA: Para habilitar a rede e o banco SQLite, execute o 'instalar_condosphere.bat'!
echo.
pause
goto start_execution

:set_modo_server
set "modo=SERVIDOR"
:: Ler configurações do db_config.json descartando qualquer caractere invisível de quebra de linha (\r)
for /f "tokens=2 delims=:," %%i in ('findstr /i "db_type" data\db_config.json 2^>nul') do (
    for /f "tokens=1" %%j in ("%%i") do set "db_type=%%j"
)
for /f "tokens=2 delims=:," %%i in ('findstr /i "server_host" data\db_config.json 2^>nul') do (
    for /f "tokens=1" %%j in ("%%i") do set "srv_host=%%j"
)
for /f "tokens=2 delims=:," %%i in ('findstr /i "server_port" data\db_config.json 2^>nul') do (
    for /f "tokens=1" %%j in ("%%i") do set "srv_port=%%j"
)
goto start_execution

:set_modo_client
set "modo=CLIENTE"
:: Ler configurações do client_config.json descartando qualquer caractere invisível de quebra de linha (\r)
for /f "tokens=2 delims=:," %%i in ('findstr /i "server_host" data\client_config.json 2^>nul') do (
    for /f "tokens=1" %%j in ("%%i") do set "srv_host=%%j"
)
for /f "tokens=2 delims=:," %%i in ('findstr /i "server_port" data\client_config.json 2^>nul') do (
    for /f "tokens=1" %%j in ("%%i") do set "srv_port=%%j"
)
goto start_execution

:start_execution
:: Limpar aspas e espaços das variáveis extraídas
if defined db_type (
    set "db_type=%db_type: =%"
    set "db_type=%db_type:"=%"
)
if defined srv_host (
    set "srv_host=%srv_host: =%"
    set "srv_host=%srv_host:"=%"
)
if defined srv_port (
    set "srv_port=%srv_port: =%"
    set "srv_port=%srv_port:"=%"
)

if "%srv_host%" equ "" set "srv_host=localhost"
if "%srv_port%" equ "" set "srv_port=3000"

:: 2. Exibir o Painel de Inicialização
echo -----------------------------------------------------------------------
echo  Modo de Operacao: [%modo%]
if "%modo%" neq "SERVIDOR" goto display_client
if /i "%db_type%" equ "sqlite" (
    echo  Banco de Dados   : SQLite Relacional (data/condosphere.db)
) else (
    if /i "%db_type%" equ "postgres" (
        echo  Banco de Dados   : PostgreSQL (Nativo da Rede)
    ) else (
        echo  Banco de Dados   : Fallback Documental (data/db.json)
    )
)
echo  IP do Servidor   : %srv_host%
echo  Porta da API     : %srv_port%
goto display_end

:display_client
echo  Conectando ao Servidor em: http://%srv_host%:%srv_port%

:display_end
echo -----------------------------------------------------------------------
echo.

:: Se for modo CLIENTE, apenas abre o index.html sintonizado e encerra
if "%modo%" neq "CLIENTE" goto execute_server
echo Sintonizando esta maquina cliente com o servidor principal...
echo Abrindo interface de portaria/cliente no seu navegador...
start "" "index.html"
exit

:execute_server
:: Se for modo SERVIDOR, precisamos verificar o Node.js e levantar a API
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERRO] O Node.js e necessario para executar o Servidor CondoSphere!
    echo Por favor, instale o Node.js antes de prosseguir ou execute 'instalar_condosphere.bat'.
    pause
    exit
)

:: Inicia o backend server.js na porta configurada e abre o navegador
echo [1/2] Iniciando o Servidor de Banco de Dados CondoSphere...
echo [2/2] Abrindo o painel administrativo no seu navegador padrao...
echo.
echo -----------------------------------------------------------------------
echo ATENCAO: Mantenha esta janela preta aberta enquanto utiliza o CondoSphere!
echo -----------------------------------------------------------------------
echo.

:: Força a abertura da URL com a porta de forma limpa e nativa (Sem aspas que quebram o parsing de protocolos no registro do Windows)
start http://localhost:%srv_port%

node server.js
if %errorlevel% neq 0 (
    echo.
    echo =======================================================================
    echo ERRO CRÍTICO: O servidor do CondoSphere parou inesperadamente!
    echo =======================================================================
    echo Verifique o log de erro acima.
    echo DICA: Se o erro for "Cannot find module 'sqlite3'", abra o prompt na pasta
    echo do projeto (C:\Projetos\CondoSphere) e rode manualmente o comando:
    echo     npm install sqlite3
    echo     ou navegue ate a pasta do projeto e execute: npm install
    echo para instalar o driver relacional do SQLite.
    echo.
    pause
)

pause
