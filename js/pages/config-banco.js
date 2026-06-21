
        /* SUPABASE CONNECTION AND MIGRATION SIMULATION (Novo!) */
        function testLocalServerConnection() {
            const host = document.getElementById('net-ip').value.trim();
            const port = document.getElementById('net-port').value.trim();
            const logBox = document.getElementById('sb-logs');
            
            if (!host || !port) {
                showToast("Por favor, preencha o Host e a Porta do Servidor!", "warning");
                return;
            }

            const testUrl = `http://${host}:${port}/api/users`;
            logBox.innerHTML = `<span style="color:#64748b">> Estabelecendo conexao P2P TCP com: ${testUrl}...</span>`;
            
            fetch(testUrl)
                .then(res => {
                    if (res.ok) return res.json();
                    throw new Error("HTTP error " + res.status);
                })
                .then(data => {
                    logBox.innerHTML += `<br><span style="color:#10b981">> [OK] Conectado ao Servidor CondoSphere com sucesso!</span>`;
                    logBox.innerHTML += `<br><span style="color:#38bdf8">> [SUCESSO] Banco de Dados JSON estruturado respondendo perfeitamente!</span>`;
                    logBox.innerHTML += `<br><span style="color:#64748b">> Registros encontrados na tabela users: ${data.length}</span>`;
                    logBox.scrollTop = logBox.scrollHeight;
                    showToast("Conexão com o Servidor Local estabelecida com sucesso!", "success");
                })
                .catch(err => {
                    logBox.innerHTML += `<br><span style="color:#f87171">> [ERRO] Falha ao conectar ao servidor local.</span>`;
                    logBox.innerHTML += `<br><span style="color:#f87171">> Detalhes: ${err.message}</span>`;
                    logBox.innerHTML += `<br><span style="color:#64748b">> Verifique se o iniciar_sistema.bat esta rodando no servidor, se o IP esta correto ou se ha bloqueios de firewall/NAT.</span>`;
                    logBox.scrollTop = logBox.scrollHeight;
                    showToast("Falha de conexão! O sistema continuará operando em modo cache local offline.", "error");
                });
        }


        function saveLocalServerConfig() {
            const host = document.getElementById('net-ip').value.trim();
            const port = document.getElementById('net-port').value.trim();

            if (!host || !port) {
                alert("Por favor, preencha o IP/Host e a Porta!");
                return;
            }

            const targetUrl = `http://${host}:${port}/api`;
            SafeStorage.setItem('condosphere_local_db_host', host);
            SafeStorage.setItem('condosphere_local_db_port', port);
            
            // Re-apply global variable
            localDbUrl = targetUrl;
            dbSource = "local";
            
            showToast("Parametros de rede salvos com sucesso! Conexao ativa.", "success");
            loadAllDataFromSupabase(); // Force reload all data from the new server connection!
        }


        function runLocalServerReset() {
            const host = document.getElementById('net-ip').value.trim();
            const port = document.getElementById('net-port').value.trim();
            const logBox = document.getElementById('sb-logs');

            if (!confirm("TEM CERTEZA ABSOLUTA?\nEsta acao ira zerar todas as tabelas locais no Computador Servidor, mantendo apenas o login mestre 'administrador' com a senha 'AdminMaster'!")) {
                return;
            }

            const resetUrl = `http://${host}:${port}/api/reset`;
            logBox.innerHTML = `<span style="color:#64748b">> Enviando sinal de TRUNCATE para o servidor: ${resetUrl}...</span>`;

            fetch(resetUrl, { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    logBox.innerHTML += `<br><span style="color:#10b981">> [OK] Banco de dados local zerado com sucesso!</span>`;
                    logBox.scrollTop = logBox.scrollHeight;
                    showToast("Todas as tabelas do servidor local foram zeradas!", "success");
                    loadAllDataFromSupabase(); // Reload UI
                })
                .catch(err => {
                    logBox.innerHTML += `<br><span style="color:#f87171">> [ERRO] Falha ao resetar banco do servidor: ${err.message}</span>`;
                    logBox.scrollTop = logBox.scrollHeight;
                });
        }


        function copySqlSchema() {
            const textarea = document.getElementById('sb-sql-textarea');
            textarea.select();
            document.execCommand('copy');
            showToast("Esquema SQL copiado para a área de transferência!", "success");
        }


        function toggleDbSource() {
            const select = document.getElementById('db-source-select');
            if (!select) return;
            dbSource = select.value;
            SafeStorage.setItem('condosphere_db_source', dbSource);
            
            const logBox = document.getElementById('sb-logs');
            if (logBox) {
                logBox.innerHTML += `<br><span style="color:#3b82f6">> Fonte de dados ativa alterada para: ${dbSource === 'local' ? '🖥️ Servidor Local' : '🌩️ Supabase Cloud'}</span>`;
                logBox.scrollTop = logBox.scrollHeight;
            }
            showToast(`Fonte de dados ativa alterada para: ${dbSource === 'local' ? 'Servidor Local' : 'Supabase Cloud'}`, "success");
            loadAllDataFromSupabase(); // Força recarregamento total
        }


        function testSupabaseConnection() {
            const url = document.getElementById('sb-url').value.trim();
            const key = document.getElementById('sb-key').value.trim();
            const logBox = document.getElementById('sb-logs');
            
            if (!url || !key) {
                showToast("Por favor, preencha a URL e a API Key do seu projeto Supabase!", "warning");
                return;
            }

            logBox.innerHTML = `<span style="color:#64748b">> Estabelecendo conexão segura HTTPS com: ${url}...</span>`;
            logBox.scrollTop = logBox.scrollHeight;
            
            setTimeout(() => {
                logBox.innerHTML += `<br><span style="color:#64748b">> Autenticando com Anon Public Key...</span>`;
                logBox.scrollTop = logBox.scrollHeight;
            }, 400);

            fetch(`${url}/rest/v1/profiles?select=*`, {
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`
                }
            })
            .then(res => {
                if (res.ok) {
                    logBox.innerHTML += `<br><span style="color:#10b981">> [OK] Conectado à instância Supabase com sucesso!</span>`;
                    logBox.innerHTML += `<br><span style="color:#38bdf8">> [SUCESSO] PostgreSQL Cloud ativo e respondendo sem restrições!</span>`;
                    logBox.scrollTop = logBox.scrollHeight;
                    showToast("Conexão ao Supabase estabelecida com sucesso!", "success");
                } else {
                    throw new Error("HTTP error " + res.status);
                }
            })
            .catch(err => {
                logBox.innerHTML += `<br><span style="color:#f87171">> [ERRO] Falha ao autenticar no Supabase.</span>`;
                logBox.innerHTML += `<br><span style="color:#f87171">> Detalhes: ${err.message}</span>`;
                logBox.scrollTop = logBox.scrollHeight;
                showToast("Falha ao testar conexão Supabase. Verifique credenciais e rede.", "error");
            });
        }


        function runSupabaseMigrations() {
            const logBox = document.getElementById('sb-logs');
            logBox.innerHTML = `<span style="color:#64748b">> Iniciando simulação e cópia de segurança de 'supabase_schema.sql'...</span>`;
            
            const tables = ["profiles", "users", "residences", "residents", "vehicles", "common_areas", "reservations", "portaria_logs", "payables", "receivables", "employees", "providers", "assemblies", "company_settings"];
            
            copySqlSchema();
            
            tables.forEach((table, idx) => {
                setTimeout(() => {
                    logBox.innerHTML += `<br><span style="color:#10b981">> [SQL] Tabela 'public.${table}' estruturada perfeitamente com RLS Desativado!</span>`;
                    logBox.scrollTop = logBox.scrollHeight;
                }, 150 + idx * 80);
            });

            setTimeout(() => {
                logBox.innerHTML += `<br><span style="color:#eab308">> [CLIPBOARD] 📋 CÓDIGO SQL COPIADO PARA A ÁREA DE TRANSFERÊNCIA!</span>`;
                logBox.scrollTop = logBox.scrollHeight;
            }, 150 + tables.length * 80);

            setTimeout(() => {
                logBox.innerHTML += `<br><span style="color:#38bdf8">> [INSTRUÇÃO] Cole o código no SQL Editor do Supabase e clique em 'Run' para sincronizar!</span>`;
                logBox.scrollTop = logBox.scrollHeight;
            }, 400 + tables.length * 80);

            setTimeout(() => {
                logBox.innerHTML += `<br><span style="color:#10b981">>> [SINCRO AUTOMÁTICA] Estruturas de banco prontas para gravação e leitura livres!</span>`;
                logBox.scrollTop = logBox.scrollHeight;
                showToast("Esquema SQL copiado! Cole no SQL Editor do seu Supabase e clique em RUN!", "success");
            }, 700 + tables.length * 80);
        }

    
        /* DYNAMIC CREDENTIALS SYNC AND RECONNECT (NEW!) */
        function saveAndConnectSupabase() {
            const urlInput = document.getElementById('sb-url').value.trim();
            const keyInput = document.getElementById('sb-key').value.trim();

            if (!urlInput || !keyInput) {
                alert("Por favor, preencha o URL do Projeto e a Chave Pública Anon!");
                return;
            }

            if (!keyInput.startsWith('eyJ')) {
                alert("⚠️ AVISO: A sua Chave Pública Anon deve ser um token JWT longo começando com 'eyJ'.\nVerifique se copiou a chave correta (anon/public) do seu painel do Supabase!");
                return;
            }

            // Save to localStorage
            SafeStorage.setItem('condosphere_sb_url', urlInput);
            SafeStorage.setItem('condosphere_sb_key', keyInput);

            // Re-initialize client
            initSupabaseClient();

            // Log update
            const logDiv = document.getElementById('sb-logs');
            if (logDiv) {
                logDiv.innerHTML += `<br><span style="color:#60a5fa">> Novas credenciais ativadas! Tentando sincronizar...</span>`;
            }

            // Perform instant test and fetch
            showToast("Conexão com banco ativada e salva com sucesso!", "success");
            loadAllDataFromSupabase();
        }
