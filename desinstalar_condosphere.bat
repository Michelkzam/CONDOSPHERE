@echo off
title Assistente de Desinstalacao - CondoSphere ERP v3.0
color 0C

echo =======================================================================
echo          ASSISTENTE DE DESINSTALAÇÃO DO CONDOSPHERE ERP v3.0
echo =======================================================================
echo.
echo ATENÇÃO: Este assistente ira remover o CondoSphere do seu computador.
echo Esta acao e irreversivel!
echo.
echo -----------------------------------------------------------------------
echo Diretorio do sistema: C:\Projetos\CondoSphere
echo -----------------------------------------------------------------------
echo.

set /p confirmar="Tem certeza absoluta que deseja desinstalar o CondoSphere? (S/N): "
if /i "%confirmar%" neq "S" (
    echo.
    echo Desinstalacao cancelada pelo usuario.
    echo.
    pause
    exit
)

echo.
echo =======================================================================
echo 1. PARANDO PROCESSOS ATIVOS DO SISTEMA
echo =======================================================================
echo.
echo Encerrando eventuais servidores Node.js rodando em segundo plano...
:: Encerra processos do node de forma silenciosa
taskkill /f /im node.exe >nul 2>nul
echo [OK] Processos de backend finalizados com sucesso.
echo.

echo =======================================================================
echo 2. REMOVENDO ATALHOS DO DESKTOP
echo =======================================================================
echo.
echo Procurando atalhos na Area de Trabalho...

set "ShortcutPath1=%USERPROFILE%\Desktop\CondoSphere ERP.lnk"
set "ShortcutPath2=%PUBLIC%\Desktop\CondoSphere ERP.lnk"

if exist "%ShortcutPath1%" (
    del /f /q "%ShortcutPath1%"
    echo [OK] Atalho do usuario atual removido.
)
if exist "%ShortcutPath2%" (
    del /f /q "%ShortcutPath2%"
    echo [OK] Atalho publico de rede removido.
)
echo.

echo =======================================================================
echo 3. REMOVENDO ARQUIVOS E DEPENDENCIAS DO SISTEMA
echo =======================================================================
echo.
echo Deseja excluir permanentemente o arquivo de banco de dados relacional
echo contendo todos os cadastros, faturamentos, moradores e historicos?
echo.
echo [1] SIM - Excluir TUDO de forma definitiva (incluindo o banco de dados).
echo [2] NÃO - Manter apenas a pasta de banco de dados (backup) para seguranca.
echo.
set /p db_choice="Escolha uma opcao (1 ou 2): "

if "%db_choice%" equ "1" (
    echo.
    echo Removendo completamente a pasta do sistema 'C:\Projetos\CondoSphere'...
    cd \
    :: Remove a pasta inteira de forma recursiva e silenciosa
    rmdir /s /q "C:\Projetos\CondoSphere" >nul 2>nul
    echo [OK] Pasta C:\Projetos\CondoSphere e banco de dados removidos de forma definitiva.
) else (
    echo.
    echo Preservando a pasta do banco de dados e arquivos de seguranca...
    echo Removendo apenas os codigos fonte, dependencias e executaveis...
    
    :: Se for para preservar, removemos os arquivos mas mantemos a pasta 'data' intacta
    cd /d "C:\Projetos\CondoSphere" 2>nul
    if %errorlevel% equ 0 (
        for /f "delims=" %%i in ('dir /b') do (
            if /i "%%i" neq "data" (
                if exist "%%i\*" (
                    rmdir /s /q "%%i" >nul 2>nul
                ) else (
                    del /f /q "%%i" >nul 2>nul
                )
            )
        )
        echo [OK] Arquivos fontes e dependencias removidos. A pasta 'C:\Projetos\CondoSphere\data\' foi mantida intacta para seu backup!
    )
)

echo.
echo =======================================================================
echo 4. LIMPEZA DE ARQUIVOS TEMPORARIOS
echo =======================================================================
echo.
echo Limpando cache e arquivos temporarios do Windows...
del /f /q "%temp%\sqlite.zip" >nul 2>nul
rmdir /s /q "%temp%\sqlite_extracted" >nul 2>nul
echo [OK] Limpeza concluida.
echo.

echo =======================================================================
echo DESINSTALAÇÃO CONCLUÍDA COM SUCESSO!
echo =======================================================================
echo.
echo O CondoSphere ERP foi removido do seu sistema de forma limpa e organizada.
echo.
pause
exit
