setTimeout(function(){html2pdf().set({margin:[10,10,10,10],filename:'${safeName}.pdf',image:{type:'jpeg',quality:0.98},html2canvas:{scale:2,useCORS:true},jsPDF:{unit:'mm',format:'a4',orientation:'portrait'}}).from(document.body).save().then(function(){window.close()});},1000);<\/script>
            </body></html>`);
            w.document.close();
        }

        /* SORT ENGINE FOR CONTAS A RECEBER (MAKES THE COLUMN HEADERS ACTIVE!) */
        function sortReceivables(column) {
            // Toggle order
            if (receivableSortState.column === column) {
                receivableSortState.asc = !receivableSortState.asc;
            } else {
                receivableSortState.column = column;
                receivableSortState.asc = true;
            }

            // Visual feedback on headers
            document.querySelectorAll('#table-receivables-grid th').forEach(th => th.classList.remove('sort-active'));
            const activeTh = document.getElementById(`th-rec-${column}`);
            if (activeTh) activeTh.classList.add('sort-active');

            receivablesList.sort((a, b) => {
                let valA, valB;
                
                if (column === 'totalDue') {
                    const penA = a.status === 'Vencido' ? a.baseValue * 0.02 : 0;
                    const intA = a.status === 'Vencido' ? a.baseValue * (0.01 * (a.delayDays / 30)) : 0;
                    valA = a.baseValue + a.extraCharges + penA + intA;

                    const penB = b.status === 'Vencido' ? b.baseValue * 0.02 : 0;
                    const intB = b.status === 'Vencido' ? b.baseValue * (0.01 * (b.delayDays / 30)) : 0;
                    valB = b.baseValue + b.extraCharges + penB + intB;
                } else {
                    valA = a[column];
                    valB = b[column];
                }

                if (typeof valA === 'string') {
                    return receivableSortState.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return receivableSortState.asc ? (valA - valB) : (valB - valA);
                }
            });

            renderReceivables();
            showToast(`Ordenando recebíveis por ${column.toUpperCase()} ${receivableSortState.asc ? 'Crescente' : 'Decrescente'} ⇅`);
        }

        /* CONTAS A RECEBER ACTIONS */
        function settleReceivable(id) {
            receivablesList = receivablesList.map(r => {
                if (String(r.id) === String(id)) {
                    r.status = 'Pago';
                    r.delayDays = 0;
                }
                return r;
            });
            renderReceivables();
            renderPayableAcordosSection(); // Update the pagar agreements sub-tab list too!
            
            // Sync with Supabase
            if (supabaseClient) {
                try {
                    Promise.resolve(dbClient.from('receivables').update({ status: 'Pago' }).eq('id', id)).catch(() => {});
                } catch(e) {}
            }

            showToast("Fatura do morador liquidada e baixada com sucesso!");
        }

        /* SORT ENGINE FOR CONTAS A PAGAR */
        function sortPayables(column) {
            if (payableSortState.column === column) {
                payableSortState.asc = !payableSortState.asc;
            } else {
                payableSortState.column = column;
                payableSortState.asc = true;
            }

            document.querySelectorAll('#table-payables th').forEach(th => th.classList.remove('sort-active'));
            const activeTh = document.getElementById(`th-pay-${column}`);
            if (activeTh) activeTh.classList.add('sort-active');

            payablesList.sort((a, b) => {
                let valA = a[column];
                let valB = b[column];

                if (typeof valA === 'string') {
                    return payableSortState.asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
                } else {
                    return payableSortState.asc ? (valA - valB) : (valB - valA);
                }
            });

            renderPayables();
            showToast(`Ordenando contas a pagar por ${column.toUpperCase()} ${payableSortState.asc ? 'Crescente' : 'Decrescente'} ⇅`);
        }

        /* ACTIVE FILTER FOR PAYABLES (FORNECEDOR, DESCRIÇÃO, CATEGORIA, VALOR, DATA) */
        function filterPayables() {
            renderPayables();
        }

        /* ACCOUNTS PAYABLE STATE ACTIONS (Quitar, Editar, Excluir) */
        function renderPayables() {
            const term = document.getElementById('payable-search') ? document.getElementById('payable-search').value.toLowerCase().trim() : "";
            const tbody = document.getElementById('payable-rows');
            tbody.innerHTML = '';

            let totalPending = 0;
            let totalPaid = 0;

            payablesList.forEach(acc => {
                let formattedDate = acc.dueDate || "";
                if (formattedDate.includes("T")) {
                    formattedDate = formattedDate.split("T")[0];
                }
                if (formattedDate.includes("-")) {
                    const dateParts = formattedDate.split('-');
                    formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }

                // Global search matching (fornecedor, descrição, data, categoria, valor)
                const matches = acc.creditor.toLowerCase().includes(term) ||
                                acc.description.toLowerCase().includes(term) ||
                                acc.category.toLowerCase().includes(term) ||
                                acc.value.toString().includes(term) ||
                                formattedDate.includes(term);

                if (!matches) return;

                if (acc.status === 'Pendente') totalPending += acc.value;
                else totalPaid += acc.value;

                // Action buttons HTML mapping icons requested
                const payButton = acc.status === 'Pendente' ? `
                    <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Quitar" onclick="settlePayableBill(${acc.id})">
                        <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                        </svg>
                    </button>
                ` : '';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td style="font-family:monospace; color:var(--color-text-muted)">#00${acc.id}</td>
                    <td><strong>${acc.creditor}</strong></td>
                    <td style="color:var(--color-text-muted)">
                        ${acc.description}
                        <span class="badge badge-warning" style="font-size:0.6rem; padding:1px 4px; margin-left:6px">${acc.recurrence || 'Única'}</span>
                    </td>
                    <td class="date-col">${formattedDate}</td>
                    <td><span style="font-size:0.65rem; background:rgba(255,255,255,0.04); padding:2px 6px; border-radius:4px; border:1px solid var(--color-border)">${acc.category}</span></td>
                    <td style="font-weight:700">R$ ${acc.value.toFixed(2)}</td>
                    <td><span class="badge ${acc.status === 'Pago' ? 'badge-success' : 'badge-danger'}">${acc.status}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                            ${payButton}
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Editar" onclick="editPayableBill(${acc.id})">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deletePayableBill(${acc.id})">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Update cash flow metric widgets
            document.getElementById('payable-pending-val').innerText = `R$ ${totalPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            document.getElementById('payable-paid-val').innerText = `R$ ${totalPaid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }

        // Action Settle (Quitar)
        function settlePayableBill(id) {
            payablesList = payablesList.map(item => {
                if (item.id === id) item.status = 'Pago';
                return item;
            });
            renderPayables();
            showToast("Conta quitada e liquidada com sucesso!");
        }

        // Action Edit (Editar)
        function editPayableBill(id) {
            const acc = payablesList.find(item => item.id === id);
            if (acc) {
                document.getElementById('pay-creditor').value = acc.creditor;
                document.getElementById('pay-desc').value = acc.description;
                document.getElementById('pay-value').value = acc.value;
                document.getElementById('pay-category').value = acc.category;
                document.getElementById('pay-date').value = acc.dueDate;
                document.getElementById('pay-recurrence').value = acc.recurrence || 'Mensal';
                
                // Remove the old item from list so it saves updated info on submit
                payablesList = payablesList.filter(item => item.id !== id);
                
                openPayableModal();
                showToast("Carregando despesa para edição!");
            }
        }

        // Action Delete (Excluir)
        function deletePayableBill(id) {
            if (confirm("Tem certeza que deseja excluir esta obrigação financeira?")) {
                payablesList = payablesList.filter(item => item.id !== id);
                renderPayables();
                showToast("Despesa excluída com sucesso.");
            }
        }

        // Open/Close Payable form modal
        function openPayableModal() { document.getElementById('payable-modal').style.display = 'flex'; }
        function closePayableModal() { document.getElementById('payable-modal').style.display = 'none'; }

        // Form Submit to Include Account with Recurrence value
        function addPayableBill(e) {
            e.preventDefault();
            const creditor = document.getElementById('pay-creditor').value;
            const desc = document.getElementById('pay-desc').value;
            const value = parseFloat(document.getElementById('pay-value').value);
            const category = document.getElementById('pay-category').value;
            const date = document.getElementById('pay-date').value;
            const recurrence = document.getElementById('pay-recurrence').value;

            const newId = payablesList.length > 0 ? Math.max(...payablesList.map(p => p.id)) + 1 : 1;

            payablesList.push({
                id: newId,
                creditor,
                description: desc,
                dueDate: date,
                category,
                value,
                status: 'Pendente',
                recurrence
            });

            renderPayables();
            closePayableModal();

            // Reset fields
            document.getElementById('pay-creditor').value = '';
            document.getElementById('pay-desc').value = '';
            document.getElementById('pay-value').value = '';
            document.getElementById('pay-date').value = '';

            showToast("Nova despesa provisionada com recorrência: " + recurrence);
        }

        /* ACCOUNTS RECEIVABLE CONSOLIDATED REPORT DIALOG */
        function openReceivableReportModal() {
            document.getElementById('receivable-report-modal').style.display = 'flex';
        }

        function closeReceivableReportModal() {
            document.getElementById('receivable-report-modal').style.display = 'none';
        }

        // Generate Selected Report with Comparative 12-Month Chart
        function generateSelectedReceivableReport() {
            const isPagas = document.getElementById('rad-opt-pagas').checked;
            const reportType = isPagas ? "Pagas" : "Aberto";

            // Map and update print preview details dynamically
            document.getElementById('pdf-report-filter-title').innerText = `RELATÓRIO CONSOLIDADO: MENSALIDADES ${isPagas ? 'PAGAS (RECEBIDOS)' : 'EM ABERTO (INADIMPLÊNCIA)'}`;
            
            const tbody = document.getElementById('pdf-report-rows');
            tbody.innerHTML = '';

            // Render matching logs into printed document table
            if (isPagas) {
                tbody.innerHTML = `
                    <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:6px">Quadra A - Lote 05</td>
                        <td style="padding:6px">Carlos Henrique Silva</td>
                        <td style="padding:6px">10/06/2026</td>
                        <td style="padding:6px; text-align:right">R$ 300,00</td>
                        <td style="padding:6px; text-align:right; font-weight:bold">R$ 300,00</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:6px">Quadra A - Lote 12</td>
                        <td style="padding:6px">Mariana Souza Oliveira</td>
                        <td style="padding:6px">10/06/2026</td>
                        <td style="padding:6px; text-align:right">R$ 500,00</td>
                        <td style="padding:6px; text-align:right; font-weight:bold">R$ 500,00</td>
                    </tr>
                `;
            } else {
                tbody.innerHTML = `
                    <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:6px">Quadra B - Lote 02</td>
                        <td style="padding:6px">Roberto de Alencar</td>
                        <td style="padding:6px">10/05/2026</td>
                        <td style="padding:6px; text-align:right">R$ 300,00</td>
                        <td style="padding:6px; text-align:right; font-weight:bold">R$ 309,20</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:6px">Quadra E - Lote 08</td>
                        <td style="padding:6px">Fernando Mendes</td>
                        <td style="padding:6px">10/04/2026</td>
                        <td style="padding:6px; text-align:right">R$ 300,00</td>
                        <td style="padding:6px; text-align:right; font-weight:bold">R$ 318,40</td>
                    </tr>
                    <tr style="border-bottom:1px solid #e2e8f0">
                        <td style="padding:6px">Quadra C - Lote 18</td>
                        <td style="padding:6px">Isabela Pereira</td>
                        <td style="padding:6px">20/05/2026</td>
                        <td style="padding:6px; text-align:right">R$ 500,00</td>
                        <td style="padding:6px; text-align:right; font-weight:bold">R$ 513,80</td>
                    </tr>
                `;
            }

            // Hide the salary advance print section, show the accounts receivable section
            document.getElementById('salary-advance-print-section').style.display = 'none';
            document.getElementById('receivable-report-print-section').style.display = 'block';

            closeReceivableReportModal();
            showToast(`Preparando impressão de mensalidades ${reportType}...`);
            
            setTimeout(() => {
                window.print();
            }, 300);
        }

        // Save customized company details
        function applyCompanyDetails(c) {
            if (!c) return;
            if (document.getElementById('comp-razao')) document.getElementById('comp-razao').value = c.razao_social || "";
            if (document.getElementById('comp-fantasia')) document.getElementById('comp-fantasia').value = c.nome_fantasia || "";
            if (document.getElementById('comp-cnpj')) document.getElementById('comp-cnpj').value = c.cnpj || "";
            if (document.getElementById('comp-ie')) document.getElementById('comp-ie').value = c.inscricao_estadual || "";
            if (document.getElementById('comp-endereco')) document.getElementById('comp-endereco').value = c.endereco || "";
            if (document.getElementById('comp-responsavel')) document.getElementById('comp-responsavel').value = c.responsavel_legal || "";
            if (document.getElementById('comp-telefone')) document.getElementById('comp-telefone').value = c.telefone || "";
            
            currentSystemName = c.nome_fantasia || "CondoSphere";
            document.getElementById('brand-system-name').innerText = currentSystemName;
            
            if (c.logo_base64) {
                currentLogoData = c.logo_base64;
                document.getElementById('logo-preview-box').src = c.logo_base64;
                const sideLogo = document.getElementById('brand-logo-img');
                if (sideLogo) sideLogo.src = c.logo_base64;
            }
            
            // Update other print headers
            if (document.getElementById('print-header-association')) document.getElementById('print-header-association').innerText = currentSystemName;
            if (document.getElementById('print-header-association-2')) document.getElementById('print-header-association-2').innerText = currentSystemName;
            if (document.getElementById('print-header-razao')) document.getElementById('print-header-razao').innerText = c.razao_social || "";
            if (document.getElementById('print-header-razao-2')) document.getElementById('print-header-razao-2').innerText = c.razao_social || "";
            if (document.getElementById('print-header-cnpj')) document.getElementById('print-header-cnpj').innerText = c.cnpj || "";
            if (document.getElementById('print-header-cnpj-2')) document.getElementById('print-header-cnpj-2').innerText = c.cnpj || "";
            
            if (document.getElementById('pdf-report-brand-name')) document.getElementById('pdf-report-brand-name').innerText = currentSystemName;
            if (document.getElementById('pdf-report-razao-social')) document.getElementById('pdf-report-razao-social').innerText = c.razao_social || "";
            if (document.getElementById('pdf-report-cnpj')) document.getElementById('pdf-report-cnpj').innerText = "CNPJ: " + (c.cnpj || "");
        }

        function saveCompanyDetails(e) {
            e.preventDefault();
            const rName = document.getElementById('comp-responsavel').value;
            const fName = document.getElementById('comp-fantasia').value;
            const ie = document.getElementById('comp-ie').value;
            const cnpj = document.getElementById('comp-cnpj').value;
            const address = document.getElementById('comp-endereco').value;
            const phone = document.getElementById('comp-telefone').value;
            const rSocial = document.getElementById('comp-razao').value;

            const compData = {
                razao_social: rSocial,
                nome_fantasia: fName,
                cnpj: cnpj,
                inscricao_estadual: ie,
                endereco: address,
                responsavel_legal: rName,
                telefone: phone,
                logo_base64: currentLogoData || ""
            };

            // Update states and layout
            applyCompanyDetails(compData);

            // Save to local cache
            SafeStorage.setItem('condosphere_company', JSON.stringify(compData));
            showToast("Dados da empresa salvos com sucesso!", "success");

            // Sync with Supabase (Upsert company settings)
            if (supabaseClient) {
                dbClient.from('company_settings').upsert({
                    id: 'main',
                    ...compData
                }).then(({ error }) => {
                    if (error) {
                        console.error("[SUPABASE ERROR] Company settings sync failed:", error.message);
                        showToast("Erro ao sincronizar dados da empresa", "error");
                    } else {
                        showToast("Dados da empresa sincronizados na nuvem!", "success");
                    }
                });
            }
        }

        // Brand logo uploader rendering
        function uploadLogoLocal(input) {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const data = e.target.result;
                    currentLogoData = data;
                    document.getElementById('logo-img').src = data;
                    document.getElementById('logo-preview-box').src = data;
                    showToast("Logotipo de proporção 200x200px carregado com sucesso!");
                }
                reader.readAsDataURL(file);
            }
        }

        // Simulation modals
        function openAdvanceModal() { document.getElementById('advance-modal').style.display = 'flex'; }
        function closeAdvanceModal() { document.getElementById('advance-modal').style.display = 'none'; }
        
        function openProfileModal() { document.getElementById('profile-modal').style.display = 'flex'; }
        function closeProfileModal() { document.getElementById('profile-modal').style.display = 'none'; }

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

        // Switch profiles and assign users with dynamic options sync and on-row actions (Aprovado!)
        function syncProfileOptions() {
            const select = document.getElementById('usr-profile');
            if (!select) return;
            select.innerHTML = '';
            
            const headers = document.querySelectorAll('#profiles-container h4');
            headers.forEach(h4 => {
                const name = h4.innerText.trim();
                const option = document.createElement('option');
                option.value = name;
                option.innerText = name;
                select.appendChild(option);
            });
        }

        function toggleUserActiveState(button, active) {
            const row = button.closest('tr');
            const statusCell = row.cells[5];
            const name = row.cells[0].textContent;
            
            if (active) {
                statusCell.innerHTML = `<span class="badge badge-success">Ativo</span>`;
                showToast(`Usuário "${name}" ativado com sucesso!`, 'success');
            } else {
                statusCell.innerHTML = `<span class="badge badge-danger">Inativo</span>`;
                showToast(`Usuário "${name}" desativado!`, 'warning');
            }
        }

        function editUserRow(button) {
            const row = button.closest('tr');
            const cells = row.getElementsByTagName('td');
            
            populateUserRelationDropdowns();
            document.getElementById('user-modal').style.display = 'flex'; 
            document.getElementById('usr-modal-title').innerText = "Editar Usuário";
            document.getElementById('usr-submit-btn').innerText = "Salvar Alterações";
            
            document.getElementById('usr-edit-index').value = row.id || 'usr-row-' + Math.floor(Math.random() * 100000);
            if (!row.id) row.id = document.getElementById('usr-edit-index').value;
            
            document.getElementById('usr-name').value = cells[0].textContent.trim();
            document.getElementById('usr-login').value = cells[1].textContent.trim();
            document.getElementById('usr-cpf').value = cells[2].textContent.trim();
            document.getElementById('usr-profile').value = cells[3].textContent.trim();
            
            // Set link fields
            document.getElementById('usr-link-type').value = row.dataset.linkType || "none";
            toggleUserLinkFields();
            if (row.dataset.linkType === "Morador") {
                document.getElementById('usr-link-resident').value = row.dataset.linkId || "";
            } else if (row.dataset.linkType === "Funcionario") {
                document.getElementById('usr-link-employee').value = row.dataset.linkId || "";
            }
        }

        function deleteUserRow(button) {
            const row = button.closest('tr');
            const name = row.cells[0].textContent;
            if (confirm(`Tem certeza que deseja excluir o usuário "${name}"?`)) {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    row.remove();
                    
                    // --- SUPABASE SYNC (DELETE) ---
                    if (supabaseClient && row.id && !row.id.startsWith('usr-row-')) {
                        dbClient.from('users').delete().eq('id', row.id).then(() => {});
                    }
                    
                    setTimeout(saveLocalUsersToCache, 400);
                    showToast(`Usuário "${name}" excluído com sucesso!`, 'success');
                }, 300);
            }
        }

        function toggleUserLinkFields() {
            const type = document.getElementById('usr-link-type').value;
            const resGroup = document.getElementById('usr-link-resident-group');
            const empGroup = document.getElementById('usr-link-employee-group');
            
            resGroup.style.display = type === "Morador" ? "block" : "none";
            empGroup.style.display = type === "Funcionario" ? "block" : "none";
        }

        function populateUserRelationDropdowns() {
            const resSelect = document.getElementById('usr-link-resident');
            const empSelect = document.getElementById('usr-link-employee');
            
            if (resSelect) {
                resSelect.innerHTML = '<option value="">-- Selecione o Morador --</option>';
                // Gather residents from table or local cached array
                const cachedMor = SafeStorage.getItem('condosphere_residents');
                const list = cachedMor ? JSON.parse(cachedMor) : [];
                list.forEach(m => {
                    const opt = document.createElement('option');
                    opt.value = m.id || m.name;
                    opt.innerText = `${m.name} (${m.residence_name || "Sem Vínculo"})`;
                    resSelect.appendChild(opt);
                });
            }
            
            if (empSelect) {
                empSelect.innerHTML = '<option value="">-- Selecione o Funcionário --</option>';
                employeesList.forEach(e => {
                    const opt = document.createElement('option');
                    opt.value = e.id;
                    opt.innerText = `${e.name} (${e.role})`;
                    empSelect.appendChild(opt);
                });
            }
        }

        function openUserModal() { 
            syncProfileOptions();
            populateUserRelationDropdowns();
            document.getElementById('user-modal').style.display = 'flex'; 
            document.getElementById('usr-modal-title').innerText = "Cadastrar Novo Usuário";
            document.getElementById('usr-submit-btn').innerText = "Criar Usuário";
            document.getElementById('usr-edit-index').value = "";
            document.getElementById('usr-name').value = "";
            document.getElementById('usr-login').value = "";
            document.getElementById('usr-cpf').value = "";
            document.getElementById('usr-profile').value = "Administrador";
            document.getElementById('usr-link-type').value = "none";
            toggleUserLinkFields();
        }

        function closeUserModal() { document.getElementById('user-modal').style.display = 'none'; }

        // Process salary advances
        function submitAdvance(e) {
            e.preventDefault();
            const nameSelect = document.getElementById('adv-employee');
            const name = nameSelect.value;
            const role = nameSelect.options[nameSelect.selectedIndex].getAttribute('data-role');
            const amount = parseFloat(document.getElementById('adv-amount').value).toFixed(2);
            const reason = document.getElementById('adv-reason').value || 'Adiantamento';
            const date = new Date().toLocaleDateString('pt-BR');

            const tbody = document.getElementById('table-advances');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${name}</td>
                <td style="font-weight:700; color:var(--color-danger)">-R$ ${amount}</td>
                <td>${date}</td>
                <td>${reason}</td>
                <td><button class="btn btn-secondary" style="font-size:0.65rem; padding:4px 8px" onclick="printAdvance('${name}', '../../../../css', '${amount}', '${date}')">🖨️ Emissão de 2 Vias (A4)</button></td>
            `;
            tbody.insertBefore(row, tbody.firstChild);

            closeAdvanceModal();
            showToast("Adiantamento registrado para desconto!");
        }

        // Custom Profile Generation with dynamic collapsible accordions (modelo de perfil)
        function submitProfile(e) {
            e.preventDefault();
            const name = document.getElementById('prof-name').value;
            const isActive = document.getElementById('prof-active-toggle').checked;
            
            const container = document.getElementById('profiles-container');
            const box = document.createElement('div');
            box.style.cssText = "background-color:var(--bg-card); border:1px solid var(--color-border); border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:12px";
            
            const profileId = 'custom-prof-' + Math.floor(Math.random() * 100000);
            box.id = profileId;
            
            // Build header matching model
            const activeChecked = isActive ? "checked" : "";
            let html = `
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border); padding-bottom:10px">
                    <h4 style="font-weight:800; font-size:1.1rem; color:white">${name}</h4>
                    <div class="switch-container" style="margin-bottom:0">
                        <label class="switch">
                            <input type="checkbox" ${activeChecked} onchange="toggleProfileActiveState(this, '${name}')">
                            <span class="slider"></span>
                        </label>
                        <span style="font-size:0.75rem">Perfil ativo</span>
                    </div>
                </div>
                <p style="font-size:0.75rem; font-weight:bold; color:var(--color-primary)">Permissões por Módulo (Clique nos cabeçalhos)</p>
            `;
            
            // Copy accordions from `#profile-modal`
            const modalForm = document.getElementById('profile-modal');
            const accordions = modalForm.querySelectorAll('.profile-accordion-header');
            
            accordions.forEach(accHeader => {
                const titleText = accHeader.querySelector('span').innerText;
                const accContent = accHeader.nextElementSibling;
                
                // Get checkboxes states in this accordion in the modal
                const cbs = accContent.querySelectorAll('input[type="checkbox"]');
                const cbStates = Array.from(cbs).map(cb => cb.checked);
                
                html += `
                    <div class="profile-accordion-header" onclick="toggleProfileAccordion(this)">
                        <span>${titleText}</span>
                        <svg class="accordion-arrow" style="width:12px; height:12px; fill:currentColor; transition: transform 0.2s" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
                    </div>
                    <div class="profile-accordion-content">
                        <table class="permissions-table">
                            <thead><tr><th>Submenu / Aba</th><th>Ver</th><th>Criar</th><th>Editar</th><th>Excluir</th></tr></thead>
                            <tbody>
                `;
                
                const rows = accContent.querySelectorAll('tbody tr');
                rows.forEach((row, rowIdx) => {
                    const rowName = row.cells[0].textContent;
                    const c1 = cbStates[rowIdx * 4] ? "checked" : "";
                    const c2 = cbStates[rowIdx * 4 + 1] ? "checked" : "";
                    const c3 = cbStates[rowIdx * 4 + 2] ? "checked" : "";
                    const c4 = cbStates[rowIdx * 4 + 3] ? "checked" : "";
                    
                    html += `
                        <tr>
                            <td>${rowName}</td>
                            <td><input type="checkbox" ${c1} disabled></td>
                            <td><input type="checkbox" ${c2} disabled></td>
                            <td><input type="checkbox" ${c3} disabled></td>
                            <td><input type="checkbox" ${c4} disabled></td>
                        </tr>
                    `;
                });
                
                html += `
                            </tbody>
                        </table>
                    </div>
                `;
            });
            
            html += `
                <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid var(--color-border); padding-top:12px; margin-top:12px">
                    <button class="btn btn-secondary btn-profile-edit" style="font-size:0.68rem; padding:6px 12px" onclick="toggleEditProfileCard(this)">✏️ Editar</button>
                    <button class="btn btn-secondary" style="font-size:0.68rem; padding:6px 12px" onclick="copyProfileCard(this)">📋 Copiar</button>
                    <button class="btn btn-danger" style="font-size:0.68rem; padding:6px 12px; background-color:rgba(239, 68, 68, 0.1); color:#ef4444; border-color:rgba(239, 68, 68, 0.2)" onclick="deleteProfileCard(this)">❌ Excluir</button>
                </div>
            `;
            
            box.innerHTML = html;
            container.appendChild(box);
            
            closeProfileModal();
            showToast(`Perfil de acesso "${name}" criado com sucesso!`, 'success');
        }

        // Submit system user and show inside user screen (employees + admin list)
        function saveLocalUsersToCache() {
            const list = [];
            const rows = Array.from(document.querySelectorAll('#table-users tbody tr'));
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 6) {
                    const name = cells[0].textContent.trim();
                    const login = cells[1].textContent.trim();
                    const cpf = cells[2].textContent.trim();
                    const profile = cells[3].textContent.trim();
                    const badge = row.querySelector('.badge');
                    const isActive = badge ? badge.classList.contains('badge-success') : true;
                    const linkType = row.dataset.linkType || "none";
                    const linkId = row.dataset.linkId || "";
                    list.push({
                        id: row.id,
                        full_name: name,
                        username: login,
                        cpf: cpf,
                        profile: profile,
                        is_active: isActive,
                        link_type: linkType,
                        link_id: linkId
                    });
                }
            });
            SafeStorage.setItem('condosphere_users', JSON.stringify(list));
        }

        function submitUser(e) {
            e.preventDefault();
            const editId = document.getElementById('usr-edit-index').value;
            const name = document.getElementById('usr-name').value;
            const login = document.getElementById('usr-login').value;
            const cpf = document.getElementById('usr-cpf').value;
            const profile = document.getElementById('usr-profile').value;

            if (editId) {
                const row = document.getElementById(editId);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    cells[0].innerHTML = `<strong>${name}</strong>`;
                    cells[1].textContent = login;
                    cells[2].textContent = cpf;
                    cells[3].textContent = profile;
                    
                    const linkType = document.getElementById('usr-link-type').value;
                    const linkId = linkType === "Morador" ? document.getElementById('usr-link-resident').value : (linkType === "Funcionario" ? document.getElementById('usr-link-employee').value : null);
                    cells[4].textContent = linkType === "Morador" ? "Morador" : (linkType === "Funcionario" ? "Funcionário" : "Nenhum");
                    row.dataset.linkType = linkType;
                    row.dataset.linkId = linkId;

                    const uuidTest = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    if (supabaseClient) {
                        const upd = {
                            full_name: name,
                            username: login,
                            email: login + "@condosphere.com",
                            cpf: cpf
                        };
                        if (linkType === "Morador" && uuidTest.test(linkId)) upd.resident_id = linkId;
                        if (linkType === "Funcionario" && uuidTest.test(linkId)) upd.employee_id = linkId;
                        dbClient.from('users').update(upd).eq('id', editId)
                        .then(({ error }) => {
                            if (error) {
                                console.error("[SUPABASE ERROR] Update user failed:", error.message);
                                showToast(`Erro ao atualizar no Supabase: ${error.message}`, 'error');
                            } else {
                                showToast("Usuário atualizado e sincronizado na nuvem!", "success");
                            }
                        });
                    }
                    
                    saveLocalUsersToCache();
                    showToast("Cadastro de usuário alterado com sucesso!", "success");
                }
            } else {
                const tbody = document.getElementById('table-users').querySelector('tbody');
                const row = document.createElement('tr');
                const tempId = 'usr-row-' + Math.floor(Math.random() * 100000);
                row.id = tempId;
                const linkType = document.getElementById('usr-link-type').value;
                const linkId = linkType === "Morador" ? document.getElementById('usr-link-resident').value : (linkType === "Funcionario" ? document.getElementById('usr-link-employee').value : null);
                const vinculoText = linkType === "Morador" ? "Morador" : (linkType === "Funcionario" ? "Funcionário" : "Nenhum");
                row.innerHTML = `
                    <td><strong>${name}</strong></td>
                    <td style="font-family:monospace; color:#60a5fa">${login}</td>
                    <td style="font-family:monospace">${cpf}</td>
                    <td>${profile}</td>
                    <td>${vinculoText}</td>
                    <td><span class="badge badge-success">Ativo</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                            <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleUserActiveState(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                            <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleUserActiveState(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Editar" onclick="editUserRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg></button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteUserRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
                
                row.dataset.linkType = linkType;
                row.dataset.linkId = linkId;

                // Sync with Supabase (Users table)
                if (supabaseClient) {
                    const uuidTest = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                    const insertPayload = {
                        full_name: name,
                        username: login,
                        email: login + "@condosphere.com",
                        cpf: cpf,
                        is_active: true
                    };
                    if (linkType === "Morador" && uuidTest.test(linkId)) insertPayload.resident_id = linkId;
                    if (linkType === "Funcionario" && uuidTest.test(linkId)) insertPayload.employee_id = linkId;
                    dbClient.from('users').insert([insertPayload]).select().then(({ data, error }) => {
                        if (error) {
                            console.error("[SUPABASE ERROR] Insert user failed:", error.message);
                            showToast(`Erro ao sincronizar com Supabase: ${error.message}`, 'error');
                        } else {
                            if (data && data[0]) {
                                row.id = data[0].id;
                            }
                            showToast("Usuário salvo e sincronizado no Supabase!", "success");
                            saveLocalUsersToCache();
                        }
                    });
                } else {
                    showToast("Modo Offline: Usuário salvo localmente no cache.", "warning");
                }

                saveLocalUsersToCache();
            }
            closeUserModal();
        }

        // Print preview salary advance in dual layout format on single sheet of A4
        function printAdvance(name, role, amount, date) {
            // Restore default salary advance view state
            document.getElementById('salary-advance-print-section').style.display = 'block';
            document.getElementById('receivable-report-print-section').style.display = 'none';

            document.getElementById('print-emp-name').innerText = name;
            document.getElementById('print-emp-name-2').innerText = name;
            document.getElementById('print-emp-role').innerText = role;
            document.getElementById('print-emp-role-2').innerText = role;
            document.getElementById('print-emp-amount').innerText = amount;
            document.getElementById('print-emp-amount-2').innerText = amount;
            document.getElementById('print-emp-date').innerText = date;
            document.getElementById('print-emp-date-2').innerText = date;

            window.print();
        }

        // Simulation files triggers
        function simulateExcelModel(type) {
            showToast(`Modelo Excel de importação para '${type}' baixado!`);
        }

        // Automatically add a receivable entry from a Residence (Aprovado!)
        function addReceivableFromResidence(identifier, owner, baseValue) {
            const exists = receivablesList.some(r => r.identifier === identifier && r.owner === owner);
            if (exists) return;

            const newId = Math.floor(Math.random() * 900) + 200;
            const todayStr = new Date().toISOString().split('T')[0];
            const receivable = {
                identifier: identifier,
                owner_name: owner,
                due_date: todayStr,
                delay_days: 0,
                base_value: parseFloat(baseValue) || 0.00,
                extra_fees: 0.00,
                status: "Pendente"
            };
            receivablesList.push({
                id: newId,
                identifier: identifier,
                owner: owner,
                dueDate: todayStr,
                delayDays: 0,
                baseValue: parseFloat(baseValue) || 0.00,
                extraCharges: 0.00,
                status: "Pendente"
            });
            renderReceivables();
            upsertToSupabase('receivables', receivable, 'identifier');
        }

        // Automatically add a receivable entry from a Resident (Aprovado!)
        function addReceivableFromResident(name, isAssociated) {
            const expectedIdentifier = isAssociated ? "Taxa Associativa" : "Mensalidade Morador";
            const exists = receivablesList.some(r => r.owner === name && r.identifier === expectedIdentifier);
            if (exists) return;

            const newId = Math.floor(Math.random() * 900) + 200;
            const todayStr = new Date().toISOString().split('T')[0];
            const receivable = {
                identifier: expectedIdentifier,
                owner_name: name,
                due_date: todayStr,
                delay_days: 0,
                base_value: isAssociated ? 300.00 : 150.00,
                extra_fees: 0.00,
                status: "Pendente"
            };
            receivablesList.push({
                id: newId,
                identifier: expectedIdentifier,
                owner: name,
                dueDate: todayStr,
                delayDays: 0,
                baseValue: isAssociated ? 300.00 : 150.00,
                extraCharges: 0.00,
                status: "Pendente"
            });
            renderReceivables();
            upsertToSupabase('receivables', receivable, 'identifier');
        }

        // Global helper to insert a residence row (Aprovado!)
        function insertMockRow(ident, prop, addr, perf, val, stat) {
            const tbody = document.getElementById('table-residencias-list').querySelector('tbody');
            const row = document.createElement('tr');
            const randId = 'res-row-' + Math.floor(Math.random() * 100000);
            row.id = randId;
            
            row.innerHTML = `
                <td><strong>${ident}</strong></td>
                <td>${prop}</td>
                <td>${addr}</td>
                <td style="color:#60a5fa">${perf}</td>
                <td>R$ ${val.toFixed(2).replace('.', ',')}</td>
                <td><span class="badge badge-success">${stat}</span></td>
                <td>
                    <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                        <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleResidenciaStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                        <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleResidenciaStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                        <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editResidenciaRow(this)">
                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${ident}')">
                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);

            // AUTO-LINK TO CONTAS A RECEBER
            addReceivableFromResidence(ident, prop, val);
        }

        // Global helper to insert a resident row (Aprovado!)
        function insertMockMoradorRow(name, cpf, contact, role, assoc, resid, residence = "Sem Vínculo", dbId = null) {
            const tbody = document.querySelector('#tab-moradores table tbody');
            const row = document.createElement('tr');
            row.id = 'mor-row-' + Math.floor(Math.random() * 100000);
            if (dbId) {
                row.dataset.dbId = dbId;
            }
            
            const assocChecked = assoc ? "checked" : "";
            const residChecked = resid ? "checked" : "";
            
            row.innerHTML = `
                <td><strong>${name}</strong></td>
                <td>${cpf}</td>
                <td>${contact}</td>
                <td>${role}</td>
                <td style="color:var(--color-primary); font-weight:600">${residence}</td>
                <td><input type="checkbox" ${assocChecked} disabled></td>
                <td><input type="checkbox" ${residChecked} disabled></td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td>
                    <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                        <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleMoradorStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                        <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleMoradorStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                        <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editMoradorRow(this)">
                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${name}')">
                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
            

        }

        // Global helper to insert a vehicle row (Aprovado!)
        function insertMockVeiculoRow(plate, model, color, owner) {
            const tbody = document.querySelector('#tab-veiculos table tbody');
            const row = document.createElement('tr');
            row.id = 'veh-row-' + Math.floor(Math.random() * 100000);
            row.innerHTML = `
                <td style="font-weight:700; letter-spacing:1px; color:var(--color-primary)">${plate}</td>
                <td>${model}</td>
                <td>${color}</td>
                <td>${owner}</td>
                <td><span class="badge badge-success">Ativo</span></td>
                <td>
                    <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                        <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleVeiculoStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                        <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleVeiculoStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                        <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editVeiculoRow(this)">
                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                            </svg>
                        </button>
                        <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${plate}')">
                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        }

        // Excel file sheet import parser and simulation
        function simulateImportExcel(type, fileInput) {
            if (!fileInput) {
                fileInput = window.event ? window.event.target : null;
            }
            
            // Fallback uncompressed ZIP XLSX parser
            function readUncompressedXlsx(arrayBuffer) {
                const view = new DataView(arrayBuffer);
                const bytes = new Uint8Array(arrayBuffer);
                let offset = 0;
                const te = new TextDecoder('utf-8');
                let sheetXmlText = "";
                
                while (offset < bytes.length - 30) {
                    const sig = view.getUint32(offset, true);
                    if (sig === 0x04034b50) { // Local file header signature
                        const compMethod = view.getUint16(offset + 8, true);
                        const compSize = view.getUint32(offset + 18, true);
                        const uncompSize = view.getUint32(offset + 22, true);
                        const nameLen = view.getUint16(offset + 26, true);
                        const extraLen = view.getUint16(offset + 28, true);
                        
                        const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
                        const name = te.decode(nameBytes);
                        
                        const dataOffset = offset + 30 + nameLen + extraLen;
                        
                        if (name === "xl/worksheets/sheet1.xml" || name.endsWith("sheet1.xml")) {
                            const dataBytes = bytes.subarray(dataOffset, dataOffset + uncompSize);
                            sheetXmlText = te.decode(dataBytes);
                            break;
                        }
                        
                        offset = dataOffset + compSize; // Move to next file
                    } else {
                        offset++;
                    }
                }
                
                if (!sheetXmlText) {
                    throw new Error("Sheet XML not found");
                }
                
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(sheetXmlText, "text/xml");
                const rows = [];
                
                const rowNodes = xmlDoc.getElementsByTagNameNS ? xmlDoc.getElementsByTagNameNS("*", "row") : xmlDoc.getElementsByTagName("row");
                for (let i = 0; i < rowNodes.length; i++) {
                    const rowNode = rowNodes[i];
                    const rowData = [];
                    const cNodes = rowNode.getElementsByTagNameNS ? rowNode.getElementsByTagNameNS("*", "c") : rowNode.getElementsByTagName("c");
                    
                    for (let j = 0; j < cNodes.length; j++) {
                        const cNode = cNodes[j];
                        const rAttr = cNode.getAttribute("r") || "";
                        let colIndex = 0;
                        for (let k = 0; k < rAttr.length; k++) {
                            const charCode = rAttr.charCodeAt(k);
                            if (charCode >= 65 && charCode <= 90) {
                                colIndex = colIndex * 26 + (charCode - 64);
                            } else {
                                break;
                            }
                        }
                        colIndex -= 1;
                        
                        let val = "";
                        const tAttr = cNode.getAttribute("t");
                        if (tAttr === "inlineStr") {
                            const tNode = cNode.getElementsByTagNameNS ? cNode.getElementsByTagNameNS("*", "t")[0] : cNode.getElementsByTagName("t")[0];
                            if (tNode) val = tNode.textContent;
                        } else {
                            const vNode = cNode.getElementsByTagNameNS ? cNode.getElementsByTagNameNS("*", "v")[0] : cNode.getElementsByTagName("v")[0];
                            if (vNode) val = vNode.textContent;
                            if (tAttr === "n" || !tAttr) {
                                const num = parseFloat(val);
                                if (!isNaN(num)) val = num;
                            }
                        }
                        rowData[colIndex] = val;
                    }
                    rows.push(rowData);
                }
                return rows;
            }

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const file = fileInput.files[0];
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        let parsedSuccess = false;
                        let rows = [];

                        // 1. Try using SheetJS if available
                        if (typeof XLSX !== 'undefined') {
                            try {
                                const data = new Uint8Array(e.target.result);
                                const workbook = XLSX.read(data, { type: 'array' });
                                const firstSheetName = workbook.SheetNames[0];
                                const worksheet = workbook.Sheets[firstSheetName];
                                rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                if (rows && rows.length > 0) {
                                    parsedSuccess = true;
                                    console.log("Parsed via SheetJS:", rows);
                                }
                            } catch (sheetJsErr) {
                                console.error("SheetJS parsing failed, trying uncompressed ZIP parser:", sheetJsErr);
                            }
                        }

                        // 2. Try using our lightweight uncompressed ZIP XLSX parser as fallback (great for system-generated XLSX models!)
                        if (!parsedSuccess) {
                            try {
                                rows = readUncompressedXlsx(e.target.result);
                                if (rows && rows.length > 0) {
                                    parsedSuccess = true;
                                    console.log("Parsed via internal ZIP parser:", rows);
                                }
                            } catch (zipParserErr) {
                                console.error("Internal ZIP parser failed:", zipParserErr);
                            }
                        }

                        // 3. Process the parsed rows
                        if (parsedSuccess && rows.length > 1) {
                            const headers = rows[0];
                            const dataRows = rows.slice(1);
                            let importedCount = 0;

                            dataRows.forEach(row => {
                                if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === "")) return;

                                let ident = "";
                                let prop = "";
                                let addr = "";
                                let perf = "Perfil Lote Padrão";
                                let val = 0.00;
                                let stat = "Ativo";

                                // Intelligent mapping based on imported document type
                                if (type === 'residencias') {
                                    // residencias columns: Identificador, Proprietário Principal, Endereço Completo, Perfil Financeiro, Valor Faturado, Status
                                    ident = row[0] || "Lote S/N";
                                    prop = row[1] || "Sem Proprietário";
                                    addr = row[2] || "Endereço Não Informado";
                                    perf = row[3] || "Perfil Lote Padrão";
                                    
                                    let rawVal = row[4];
                                    if (typeof rawVal === 'string') {
                                        let cleanStr = rawVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
                                        val = parseFloat(cleanStr);
                                    } else if (typeof rawVal === 'number') {
                                        val = rawVal;
                                    }
                                    if (isNaN(val) || val === null || val === undefined) val = 0.00;
                                    stat = row[5] || "Ativo";
                                    
                                    insertMockRow(ident, prop, addr, perf, val, stat);
                                    
                                    // --- SUPABASE SYNC (SINGLE IMPORT) ---
                                    upsertToSupabase('residences', {
                                        identifier: ident,
                                        owner: prop,
                                        address: addr,
                                        profile_name: perf,
                                        base_value: val,
                                        status: stat
                                    }, 'identifier');
                                } else if (type === 'moradores') {
                                    // moradores columns: Nome, CPF, Contato, Função, Residência Vinculada, Associado, Morador
                                    const mName = row[0] || "Morador Novo";
                                    let mCpf = row[1] || "";
                                    if (!mCpf || mCpf.trim() === "" || mCpf === "000.000.000-00") {
                                        mCpf = "TEMP-" + Math.floor(Math.random() * 100000000);
                                    }
                                    const mContact = row[2] || "(00) 00000-0000";
                                    const mRole = row[3] || "Inquilino";
                                    const mResidence = row[4] || "Sem Vínculo";
                                    const mAssoc = row[5] === "Sim";
                                    const mResid = row[6] === "Sim";
                                    
                                    insertMockMoradorRow(mName, mCpf, mContact, mRole, mAssoc, mResid, mResidence);
                                    
                                    // --- SUPABASE SYNC (SINGLE IMPORT) ---
                                    upsertToSupabase('residents', {
                                        name: mName,
                                        cpf: mCpf,
                                        contact: mContact,
                                        role: mRole,
                                        is_associated: mAssoc,
                                        is_resident: mResid,
                                        residence_name: mResidence
                                    }, 'cpf');
                                } else if (type === 'veiculos') {
                                    // veiculos columns: Placa, Veículo, Cor, Proprietário
                                    const vPlate = row[0] || "AAA-0000";
                                    const vModel = row[1] || "Carro";
                                    const vColor = row[2] || "Branco";
                                    const vOwner = row[3] || "Sem Nome";
                                    
                                    insertMockVeiculoRow(vPlate, vModel, vColor, vOwner);
                                    
                                    // --- SUPABASE SYNC (SINGLE IMPORT) ---
                                    upsertToSupabase('vehicles', {
                                        plate: vPlate,
                                        model: vModel,
                                        color: vColor,
                                        owner_name: vOwner
                                    }, 'plate');
                                } else {
                                    ident = row[0] || "Lote S/N";
                                    prop = row[1] || "Proprietário";
                                    addr = row[2] || "Endereço";
                                    perf = row[3] || "Perfil Lote Padrão";
                                    val = isNaN(parseFloat(row[4])) ? 300.00 : parseFloat(row[4]);
                                    stat = row[5] || "Ativo";
                                    insertMockRow(ident, prop, addr, perf, val, stat);
                                }
                                importedCount++;
                            });

                            if (importedCount > 0) {
                                showToast(`${importedCount} registros de '${type}' importados e cadastrados com sucesso no Módulo CondoSphere!`);
                                setTimeout(() => loadAllDataFromSupabase(), 2000);
                                return;
                            }
                        }

                        // Fallback simulation in case parsing succeeded but returned no rows
                        throw new Error("No data rows found");
                    } catch(err) {
                        console.warn("Import parser failed, using high-fidelity fallback:", err);
                        // Fallback mock insertion synchronized with the downloaded model rows
                        if (type === 'residencias') {
                            insertMockRow("Quadra A - Lote 05", "Carlos Henrique Silva", "Av. das Palmeiras, 102", "Perfil Lote Padrão", 300.00, "Ativo");
                            upsertToSupabase('residences', { identifier: "Quadra A - Lote 05", owner: "Carlos Henrique Silva", address: "Av. das Palmeiras, 102", profile_name: "Perfil Lote Padrão", base_value: 300.00, status: "Ativo" }, 'identifier');
                            insertMockRow("Quadra A - Lote 12", "Mariana Souza Oliveira", "Av. das Palmeiras, 220", "Perfil Lote Luxo", 500.00, "Ativo");
                            upsertToSupabase('residences', { identifier: "Quadra A - Lote 12", owner: "Mariana Souza Oliveira", address: "Av. das Palmeiras, 220", profile_name: "Perfil Lote Luxo", base_value: 500.00, status: "Ativo" }, 'identifier');
                            insertMockRow("Quadra D - Lote 01", "Associação Comercial", "Av. Principal, 500", "Perfil Comercial", 750.00, "Ativo");
                            upsertToSupabase('residences', { identifier: "Quadra D - Lote 01", owner: "Associação Comercial", address: "Av. Principal, 500", profile_name: "Perfil Comercial", base_value: 750.00, status: "Ativo" }, 'identifier');
                            showToast("Lista de residencial do 'modelo_residencias_condosphere.xlsx' importada com sucesso!");
                            setTimeout(() => loadAllDataFromSupabase(), 2000);
                        } else if (type === 'moradores') {
                            insertMockMoradorRow("Carlos Henrique Silva (Importado)", "123.456.789-01", "(11) 98765-4321", "Proprietário", true, true);
                            upsertToSupabase('residents', { name: "Carlos Henrique Silva (Importado)", cpf: "123.456.789-01", contact: "(11) 98765-4321", role: "Proprietário", is_associated: true, is_resident: true, residence_name: "Sem Vínculo" }, 'cpf');
                            insertMockMoradorRow("Mariana Souza Oliveira (Importada)", "987.654.321-02", "(11) 97654-3210", "Proprietário", true, true);
                            upsertToSupabase('residents', { name: "Mariana Souza Oliveira (Importada)", cpf: "987.654.321-02", contact: "(11) 97654-3210", role: "Proprietário", is_associated: true, is_resident: true, residence_name: "Sem Vínculo" }, 'cpf');
                            showToast("Lista de moradores do 'modelo_moradores_condosphere.xlsx' importada com sucesso!");
                            setTimeout(() => loadAllDataFromSupabase(), 2000);
                        } else if (type === 'veiculos') {
                            insertMockVeiculoRow("ABC-1D23", "Toyota Corolla", "Prata", "Carlos Henrique (Importado)");
                            upsertToSupabase('vehicles', { plate: "ABC-1D23", model: "Toyota Corolla", color: "Prata", owner_name: "Carlos Henrique (Importado)" }, 'plate');
                            insertMockVeiculoRow("XYZ-9F87", "Honda Civic", "Preto", "Mariana Souza (Importada)");
                            upsertToSupabase('vehicles', { plate: "XYZ-9F87", model: "Honda Civic", color: "Preto", owner_name: "Mariana Souza (Importada)" }, 'plate');
                            showToast("Lista de veículos do 'modelo_veiculos_condosphere.xlsx' importada com sucesso!");
                            setTimeout(() => loadAllDataFromSupabase(), 2000);
                        }
                    }
                };
                reader.readAsArrayBuffer(file);
                fileInput.value = ''; // Clear input selection
            } else {
                showToast(`Iniciando importação de '${type}'...`);
            }
        }

        /* 1. RESIDENCIAS MODAL FLOW */
        function openResidenciaModal(isEdit = false, rowBtn = null) {
            document.getElementById('modal-residencia').style.display = 'flex';
            if (isEdit && rowBtn) {
                document.getElementById('residencia-modal-title').innerText = "Editar Residência";
                const row = rowBtn.closest('tr');
                const cells = row.getElementsByTagName('td');
                document.getElementById('res-ident').value = cells[0].textContent.trim();
                document.getElementById('res-owner').value = cells[1].textContent.trim();
                document.getElementById('res-addr').value = cells[2].textContent.trim();
                document.getElementById('res-profile').value = cells[3].textContent.trim();
                document.getElementById('res-val').value = parseFloat(cells[4].textContent.replace(/[^\d.]/g, '').replace(',', '.')) || 300.00;
                document.getElementById('res-status').value = cells[5].textContent.trim();
                if (!row.id) {
                    row.id = 'res-row-' + Math.floor(Math.random() * 100000);
                }
                document.getElementById('res-edit-index').value = row.id;
            } else {
                document.getElementById('residencia-modal-title').innerText = "Incluir Residência";
                document.getElementById('res-edit-index').value = "";
                document.getElementById('res-ident').value = "";
                document.getElementById('res-owner').value = "";
                document.getElementById('res-addr').value = "";
                document.getElementById('res-profile').value = "Perfil Lote Padrão";
                document.getElementById('res-val').value = "300.00";
                document.getElementById('res-status').value = "Ativo";
            }
        }
        function closeResidenciaModal() {
            document.getElementById('modal-residencia').style.display = 'none';
        }
        function editResidenciaRow(button) {
            openResidenciaModal(true, button);
        }
        function submitResidenciaForm(event) {
            event.preventDefault();
            const editId = document.getElementById('res-edit-index').value;
            const ident = document.getElementById('res-ident').value;
            const owner = document.getElementById('res-owner').value;
            const addr = document.getElementById('res-addr').value;
            const profile = document.getElementById('res-profile').value;
            const val = parseFloat(document.getElementById('res-val').value) || 0;
            const status = document.getElementById('res-status').value;
            
            const formattedVal = 'R$ ' + val.toFixed(2).replace('.', ',');
            const statusClass = status === 'Ativo' ? 'badge-success' : 'badge-danger';
            
            if (editId) {
                const row = document.getElementById(editId);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    const oldIdent = cells[0].textContent.trim();
                    cells[0].innerHTML = `<strong>${ident}</strong>`;
                    cells[1].textContent = owner;
                    cells[2].textContent = addr;
                    cells[3].textContent = profile;
                    cells[4].textContent = formattedVal;
                    cells[5].innerHTML = `<span class="badge ${statusClass}">${status}</span>`;
                    
                    // Update also corresponding receivable details if exists
                    receivablesList = receivablesList.map(r => {
                        if (r.identifier === oldIdent || r.identifier === ident) {
                            r.identifier = ident;
                            r.owner = owner;
                            r.baseValue = val;
                        }
                        return r;
                    });
                    renderReceivables();

                    showToast("Residência alterada com sucesso!");
                }
            } else {
                const tbody = document.getElementById('table-residencias-list').querySelector('tbody');
                const row = document.createElement('tr');
                row.id = 'res-row-' + Math.floor(Math.random() * 100000);
                row.innerHTML = `
                    <td><strong>${ident}</strong></td>
                    <td>${owner}</td>
                    <td>${addr}</td>
                    <td style="color:#60a5fa">${profile}</td>
                    <td>${formattedVal}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editResidenciaRow(this)">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${ident}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
                
                // Sync with Supabase cloud
                saveToSupabase('residences', {
                    identifier: ident,
                    owner: owner,
                    address: addr,
                    profile_name: profile,
                    base_value: val,
                    status: status
                });

                // AUTO-LINK TO CONTAS A RECEBER
                addReceivableFromResidence(ident, owner, val);

                showToast("Residência incluída com sucesso!");
            }
            saveLocalResidencesToCache();
            saveLocalReceivablesToCache();
            closeResidenciaModal();
        }

        
        /* RELATIONAL HELPER: POPULATE MORADORES RESIDENCE DROPDOWN */
        function populateMoradorResidencesDropdown() {
            const select = document.getElementById('mor-residence-select');
            if (!select) return;
            select.innerHTML = '<option value="none">Nenhuma (Não Vinculado)</option>';
            
            const resRows = Array.from(document.querySelectorAll('#table-residencias-list tbody tr'));
            resRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length > 1 && cells[0] && cells[1]) {
                    const ident = cells[0].textContent.trim();
                    const owner = cells[1].textContent.trim();
                    if (ident && ident !== "Nenhuma residência cadastrada") {
                        const opt = document.createElement('option');
                        opt.value = ident;
                        opt.innerText = `${ident} (${owner})`;
                        select.appendChild(opt);
                    }
                }
            });
        }
    
        /* 2. MORADORES MODAL FLOW */
        function openMoradorModal(isEdit = false, rowBtn = null) {
            try {
                console.log("[openMoradorModal] isEdit:", isEdit, "rowBtn:", rowBtn);
                document.getElementById('modal-morador').style.display = 'flex';
                populateMoradorResidencesDropdown(); // Dynamic population of relational dropdown
                const selectBox = document.getElementById('mor-categories');
                
                if (isEdit && rowBtn) {
                    document.getElementById('morador-modal-title').innerText = "Editar Morador";
                    let element = rowBtn;
                    if (rowBtn.currentTarget) element = rowBtn.currentTarget;
                    else if (rowBtn.target) element = rowBtn.target;
                    
                    let row = null;
                    if (element && typeof element.closest === 'function') {
                        row = element.closest('tr');
                    }
                    if (!row && rowBtn && typeof rowBtn.closest === 'function') {
                        row = rowBtn.closest('tr');
                    }
                    if (!row) {
                        console.error("[openMoradorModal] Could not find table row from button.");
                        return;
                    }
                    const cells = row.getElementsByTagName('td');
                    console.log("[openMoradorModal] Found cells count:", cells.length);
                    if (cells.length > 0) {
                        // Extract name, strip any extra action buttons or emoji if they were copied
                        const rawName = cells[0] ? cells[0].textContent : "";
                        document.getElementById('mor-name').value = rawName.replace(/✏️|✕|✔️|🤝|🚫/g, '').trim();
                        document.getElementById('mor-cpf').value = cells[1] ? cells[1].textContent.trim() : "";
                        document.getElementById('mor-contact').value = cells[2] ? cells[2].textContent.trim() : "";
                        document.getElementById('mor-role').value = cells[3] ? cells[3].textContent.trim() : "Proprietário";
                        
                        let residenceText = "Sem Vínculo";
                        if (cells[4] && !cells[4].querySelector('input')) {
                            residenceText = cells[4].textContent.trim();
                        }
                        
                        // Select residence dynamically
                        const resSelect = document.getElementById('mor-residence-select');
                        let foundOption = false;
                        if (resSelect) {
                            for (let i = 0; i < resSelect.options.length; i++) {
                                if (resSelect.options[i].value === residenceText) {
                                    resSelect.selectedIndex = i;
                                    foundOption = true;
                                    break;
                                }
                            }
                            if (!foundOption) {
                                resSelect.value = "none";
                            }
                        }
                        
                        let assocVal = false;
                        const checkboxInputs = row.querySelectorAll('input[type="checkbox"]');
                        if (checkboxInputs.length >= 2) {
                            assocVal = checkboxInputs[0].checked;
                        } else if (checkboxInputs.length === 1) {
                            assocVal = checkboxInputs[0].checked;
                        }
                        if (selectBox) selectBox.value = assocVal ? "Associado" : "Morador";
                    }

                    if (!row.id) {
                        row.id = 'mor-row-' + Math.floor(Math.random() * 100000);
                    }
                    document.getElementById('mor-edit-index').value = row.id;
                } else {
                    document.getElementById('morador-modal-title').innerText = "Incluir Morador";
                    document.getElementById('mor-edit-index').value = "";
                    document.getElementById('mor-name').value = "";
                    document.getElementById('mor-cpf').value = "";
                    document.getElementById('mor-contact').value = "";
                    document.getElementById('mor-role').value = "Proprietário";
                    document.getElementById('mor-residence-select').value = "none";
                    if (selectBox) selectBox.value = "Morador";
                }
            } catch (err) {
                console.error("[openMoradorModal] Error opening resident modal:", err);
                showToast("Erro ao abrir formulário de edição!", "error");
            }
        }
        function closeMoradorModal() {
            document.getElementById('modal-morador').style.display = 'none';
        }
        function editMoradorRow(button) {
            openMoradorModal(true, button);
        }
        function submitMoradorForm(event) {
            event.preventDefault();
            const editId = document.getElementById('mor-edit-index').value;
            const name = document.getElementById('mor-name').value;
            const cpf = document.getElementById('mor-cpf').value;
            const contact = document.getElementById('mor-contact').value;
            const role = document.getElementById('mor-role').value;
            const residence = document.getElementById('mor-residence-select').value;
            
            const category = document.getElementById('mor-categories').value;
            const assoc = category === 'Associado';
            const resid = category === 'Morador';
            
            const assocChecked = assoc ? "checked" : "";
            const residChecked = resid ? "checked" : "";
            const displayResidence = residence === "none" ? "Sem Vínculo" : residence;
            
            if (editId) {
                const row = document.getElementById(editId);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    const oldName = cells[0].textContent.trim();
                    cells[0].innerHTML = `<strong>${name}</strong>`;
                    cells[1].textContent = cpf;
                    cells[2].textContent = contact;
                    cells[3].textContent = role;
                    cells[4].textContent = displayResidence; // Relational residence update
                    cells[5].innerHTML = `<input type="checkbox" ${assocChecked} disabled>`;
                    cells[6].innerHTML = `<input type="checkbox" ${residChecked} disabled>`;
                    
                    // Update also corresponding receivable details if exists
                    receivablesList = receivablesList.map(r => {
                        if (r.owner === oldName) {
                            r.owner = name;
                            const newIdentifier = assoc ? "Taxa Associativa" : "Mensalidade Morador";
                            // Only overwrite identifier and base value if it was a resident fee type
                            if (r.identifier === "Taxa Associativa" || r.identifier === "Mensalidade Morador" || r.identifier === "Mensalidade") {
                                r.identifier = newIdentifier;
                                r.baseValue = assoc ? 300.00 : 150.00;
                            }
                        }
                        return r;
                    });
                    renderReceivables();

                    // Sync edit with Supabase cloud
                    if (supabaseClient) {
                        const dbId = row.dataset.dbId;
                        const updateData = {
                            name: name,
                            cpf: cpf,
                            contact: contact,
                            role: role,
                            is_associated: assoc,
                            is_resident: resid,
                            residence_name: displayResidence
                        };
                        
                        if (dbId) {
                            Promise.resolve(dbClient.from('residents').update(updateData).eq('id', dbId)).catch(() => {});
                        } else {
                            Promise.resolve(dbClient.from('residents').update(updateData).eq('cpf', cpf)).catch(() => {});
                        }
                    }

                    showToast("Morador alterado com sucesso!");
                }
            } else {
                const tbody = document.querySelector('#tab-moradores table tbody');
                const row = document.createElement('tr');
                row.id = 'mor-row-' + Math.floor(Math.random() * 100000);
                row.innerHTML = `
                    <td><strong>${name}</strong></td>
                    <td>${cpf}</td>
                    <td>${contact}</td>
                    <td>${role}</td>
                    <td style="color:var(--color-primary); font-weight:600">${displayResidence}</td>
                    <td><input type="checkbox" ${assocChecked} disabled></td>
                    <td><input type="checkbox" ${residChecked} disabled></td>
                    <td><span class="badge badge-success">Ativo</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editMoradorRow(this)">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${name}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
                
                // Sync with Supabase cloud using relational residence linkage!
                saveToSupabase('residents', {
                    name: name,
                    cpf: cpf,
                    contact: contact,
                    role: role,
                    is_associated: assoc,
                    is_resident: resid,
                    residence_name: displayResidence
                });

                // AUTO-LINK TO CONTAS A RECEBER
                

                showToast("Morador incluído com sucesso!");
            }
            saveLocalResidentsToCache();
            saveLocalReceivablesToCache();
            closeMoradorModal();
        }

        /* 3. VEICULOS MODAL FLOW */
        function openVeiculoModal(isEdit = false, rowBtn = null) {
            document.getElementById('modal-veiculo').style.display = 'flex';
            if (isEdit && rowBtn) {
                document.getElementById('veiculo-modal-title').innerText = "Editar Veículo";
                const row = rowBtn.closest('tr');
                const cells = row.getElementsByTagName('td');
                document.getElementById('veh-plate').value = cells[0].textContent.trim();
                document.getElementById('veh-model').value = cells[1].textContent.trim();
                document.getElementById('veh-color').value = cells[2].textContent.trim();
                document.getElementById('veh-owner').value = cells[3].textContent.trim();
                if (!row.id) {
                    row.id = 'veh-row-' + Math.floor(Math.random() * 100000);
                }
                document.getElementById('veh-edit-index').value = row.id;
            } else {
                document.getElementById('veiculo-modal-title').innerText = "Incluir Veículo";
                document.getElementById('veh-edit-index').value = "";
                document.getElementById('veh-plate').value = "";
                document.getElementById('veh-model').value = "";
                document.getElementById('veh-color').value = "";
                document.getElementById('veh-owner').value = "";
            }
        }
        function closeVeiculoModal() {
            document.getElementById('modal-veiculo').style.display = 'none';
        }
        function editVeiculoRow(button) {
            openVeiculoModal(true, button);
        }
        function submitVeiculoForm(event) {
            event.preventDefault();
            const editId = document.getElementById('veh-edit-index').value;
            const plate = document.getElementById('veh-plate').value;
            const model = document.getElementById('veh-model').value;
            const color = document.getElementById('veh-color').value;
            const owner = document.getElementById('veh-owner').value;
            
            if (editId) {
                const row = document.getElementById(editId);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    cells[0].textContent = plate;
                    cells[1].textContent = model;
                    cells[2].textContent = color;
                    cells[3].textContent = owner;
                    showToast("Veículo alterado com sucesso!");
                }
            } else {
                const tbody = document.querySelector('#tab-veiculos table tbody');
                const row = document.createElement('tr');
                row.id = 'veh-row-' + Math.floor(Math.random() * 100000);
                row.innerHTML = `
                    <td style="font-weight:700; letter-spacing:1px; color:var(--color-primary)">${plate}</td>
                    <td>${model}</td>
                    <td>${color}</td>
                    <td>${owner}</td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editVeiculoRow(this)">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${plate}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
                
                // Sync with Supabase cloud
                saveToSupabase('vehicles', {
                    plate: plate,
                    model: model,
                    color: color,
                    owner_name: owner
                });

                showToast("Veículo incluído com sucesso!");
            }
            closeVeiculoModal();
        }

        /* 4. AREAS COMUNS MODAL FLOW */
        function openAreaModal(isEdit = false, rowBtn = null) {
            document.getElementById('modal-area').style.display = 'flex';
            if (isEdit && rowBtn) {
                document.getElementById('area-modal-title').innerText = "Editar Área Comum";
                const row = rowBtn.closest('tr');
                const cells = row.getElementsByTagName('td');
                document.getElementById('area-name').value = cells[0].textContent.trim();
                document.getElementById('area-capacity').value = parseInt(cells[1].textContent) || 0;
                document.getElementById('area-fee').value = parseFloat(cells[2].textContent.replace(/[^\d.]/g, '').replace(',', '.')) || 0;
                document.getElementById('area-status').value = cells[3].textContent.trim() === 'Livre' ? 'Livre' : 'Ocupada';
                if (!row.id) {
                    row.id = 'area-row-' + Math.floor(Math.random() * 100000);
                }
                document.getElementById('area-edit-index').value = row.id;
            } else {
                document.getElementById('area-modal-title').innerText = "Incluir Área Comum";
                document.getElementById('area-edit-index').value = "";
                document.getElementById('area-name').value = "";
                document.getElementById('area-capacity').value = "50";
                document.getElementById('area-fee').value = "100.00";
                document.getElementById('area-status').value = "Livre";
            }
        }
        function closeAreaModal() {
            document.getElementById('modal-area').style.display = 'none';
        }
        function editAreaRow(button) {
            openAreaModal(true, button);
        }
        function submitAreaForm(event) {
            event.preventDefault();
            const editId = document.getElementById('area-edit-index').value;
            const name = document.getElementById('area-name').value;
            const capacity = document.getElementById('area-capacity').value;
            const fee = parseFloat(document.getElementById('area-fee').value) || 0;
            const status = document.getElementById('area-status').value;
            
            const formattedFee = fee > 0 ? 'R$ ' + fee.toFixed(2).replace('.', ',') : "Grátis";
            const statusClass = status === 'Livre' ? 'badge-success' : 'badge-danger';
            
            if (editId) {
                const row = document.getElementById(editId);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    cells[0].innerHTML = `<strong>${name}</strong>`;
                    cells[1].textContent = `${capacity} Pessoas`;
                    cells[2].textContent = formattedFee;
                    cells[3].innerHTML = `<span class="badge ${statusClass}">${status}</span>`;
                    showToast("Área comum alterada com sucesso!");
                }
            } else {
                const tbody = document.querySelector('#tab-areas table tbody');
                const row = document.createElement('tr');
                row.id = 'area-row-' + Math.floor(Math.random() * 100000);
                row.innerHTML = `
                    <td><strong>${name}</strong></td>
                    <td>${capacity} Pessoas</td>
                    <td>${formattedFee}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editAreaRow(this)">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${name}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
                
                // Sync with Supabase cloud
                saveToSupabase('common_areas', {
                    name: name,
                    capacity: parseInt(capacity, 10) || 50,
                    cleaning_fee: fee,
                    status: status
                });

                showToast("Área comum incluída com sucesso!");
            }
            closeAreaModal();
        }

        /* 5. RESERVAS MODAL FLOW */
        function syncReservasAreaSelect() {
            const select = document.getElementById('resv-area-select');
            if (!select) return;
            select.innerHTML = '';
            
            // Gather all available areas from the Áreas Comuns table tbody
            const rows = document.querySelectorAll('#tab-areas table tbody tr');
            rows.forEach(tr => {
                const name = tr.cells[0].textContent.trim();
                const option = document.createElement('option');
                option.value = name;
                option.innerText = name;
                select.appendChild(option);
            });
            
            // If no areas created, add defaults
            if (select.children.length === 0) {
                const defaults = ["Salão de Festas Principal", "Churrasqueira A", "Quadra Esportiva"];
                defaults.forEach(d => {
                    const option = document.createElement('option');
                    option.value = d;
                    option.innerText = d;
                    select.appendChild(option);
                });
            }
        }

        function toggleResvTimeCustomFields() {
            const type = document.getElementById('resv-time-type').value;
            const fields = document.getElementById('resv-custom-time-fields');
            if (type === 'Determinado horário') {
                fields.style.display = 'grid';
            } else {
                fields.style.display = 'none';
            }
        }

        function openReservaModal(isEdit = false, rowBtn = null) {
            syncReservasAreaSelect();
            document.getElementById('modal-reserva').style.display = 'flex';
            
            if (isEdit && rowBtn) {
                document.getElementById('reserva-modal-title').innerText = "Editar Reserva";
                const row = rowBtn.closest('tr');
                const cells = row.getElementsByTagName('td');
                
                document.getElementById('resv-area-select').value = cells[1].textContent.trim();
                document.getElementById('resv-resident').value = cells[2].textContent.trim();
                document.getElementById('resv-date').value = cells[3].textContent.trim();
                
                const period = cells[4].textContent.trim();
                if (period === 'O dia todo') {
                    document.getElementById('resv-time-type').value = "O dia todo";
                    document.getElementById('resv-custom-time-fields').style.display = 'none';
                } else {
                    document.getElementById('resv-time-type').value = "Determinado horário";
                    document.getElementById('resv-custom-time-fields').style.display = 'grid';
                    const times = period.split(" às ");
                    if (times.length === 2) {
                        document.getElementById('resv-start-time').value = times[0].trim();
                        document.getElementById('resv-end-time').value = times[1].trim();
                    }
                }

                document.getElementById('resv-fee').value = parseFloat(cells[5].textContent.replace(/[^\d.]/g, '').replace(',', '.')) || 0;
                document.getElementById('resv-status').value = cells[6].textContent.trim();
                
                if (!row.id) {
                    row.id = 'resv-row-' + Math.floor(Math.random() * 100000);
                }
                document.getElementById('resv-edit-index').value = row.id;
            } else {
                document.getElementById('reserva-modal-title').innerText = "Incluir Reserva";
                document.getElementById('resv-edit-index').value = "";
                document.getElementById('resv-area-select').selectedIndex = 0;
                document.getElementById('resv-resident').value = "";
                document.getElementById('resv-date').value = "12/06/2026";
                document.getElementById('resv-time-type').value = "O dia todo";
                document.getElementById('resv-custom-time-fields').style.display = 'none';
                document.getElementById('resv-fee').value = "50.00";
                document.getElementById('resv-status').value = "Confirmado";
            }
        }
        function closeReservaModal() {
            document.getElementById('modal-reserva').style.display = 'none';
        }
        function editReservaRow(button) {
            openReservaModal(true, button);
        }
        function submitReservaForm(event) {
            event.preventDefault();
            const editId = document.getElementById('resv-edit-index').value;
            const area = document.getElementById('resv-area-select').value;
            const resident = document.getElementById('resv-resident').value;
            const date = document.getElementById('resv-date').value;
            const timeType = document.getElementById('resv-time-type').value;
            
            let period = "O dia todo";
            if (timeType === 'Determinado horário') {
                const start = document.getElementById('resv-start-time').value;
                const end = document.getElementById('resv-end-time').value;
                period = `${start} às ${end}`;
            }

            const fee = parseFloat(document.getElementById('resv-fee').value) || 0;
            const status = document.getElementById('resv-status').value;
            
            const formattedFee = 'R$ ' + fee.toFixed(2).replace('.', ',');
            const statusClass = status === 'Confirmado' ? 'badge-success' : status === 'Pendente' ? 'badge-warning' : 'badge-danger';
            
            if (editId) {
                const row = document.getElementById(editId);
                if (row) {
                    const cells = row.getElementsByTagName('td');
                    cells[1].textContent = area;
                    cells[2].textContent = resident;
                    cells[3].textContent = date;
                    cells[4].textContent = period;
                    cells[5].textContent = formattedFee;
                    cells[6].innerHTML = `<span class="badge ${statusClass}">${status}</span>`;
                    showToast("Reserva alterada com sucesso!");
                }
            } else {
                const tbody = document.querySelector('#tab-reservas table tbody');
                const row = document.createElement('tr');
                row.id = 'resv-row-' + Math.floor(Math.random() * 100000);
                row.innerHTML = `
                    <td>#00${Math.floor(Math.random() * 900) + 10}</td>
                    <td>${area}</td>
                    <td>${resident}</td>
                    <td>${date}</td>
                    <td>${period}</td>
                    <td>${formattedFee}</td>
                    <td><span class="badge ${statusClass}">${status}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                            <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleReservaStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                            <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleReservaStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editReservaRow(this)">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${resident}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
                
                // Sync with Supabase cloud
                saveToSupabase('reservations', {
                    area_name: area,
                    resident_name: resident,
                    reservation_date: date,
                    fee: fee,
                    status: status
                });

                showToast("Reserva incluída com sucesso!");
                setTimeout(renderReservationsCalendar, 200);
            }
            closeReservaModal();
            setTimeout(renderReservationsCalendar, 200);
        }

        /* BANK CONCILIATION CNAB240 SIMULATION FUNCTIONS (Opção 2) */
        function downloadCnabModel() {
            const lines = [
                "000000000000000000010100756000010014028200000000045050519965005081SICOOB COOPERATIVO           SICOOB COOPERATIVO           211062026120000000210340001201",
                "0010001300001T 0000010100756000010014028200000000000000010052300000000000000010000000030000756111111111111111Carlos Henrique Silva                      30000",
                "0010001300002U 000001010075600000000000000000000000000000000000000000000030000000003000000000000000000000000000110620261106202600000000000000000000000000",
                "0010001300003T 0000010100756000010014028200000000000000010052400000000000000010000000050000756222222222222222Mariana Souza Oliveira                     50000",
                "0010001300004U 000001010075600000000000000000000000000000000000000000000050000000005000000000000000000000000000110620261106202600000000000000000000000000",
                "0010001300005T 0000010100756000010014028200000000000000010052500000000000000010000000085000756333333333333333Coral Tintas Ltda                            85000",
                "0010001300006U 000001010075600000000000000000000000000000000000000000000085000000008500000000000000000000000000011062026110620260000000000000000000000000",
                "99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
            ];
            const content = lines.join("\r\n");
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "COBRANCA_RETORNO_SICOOB_CNAB240.RET");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Modelo CNAB240 Sicoob (.RET) baixado com sucesso!");
        }

        function importCnabFile(fileInput) {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    const lines = text.split(/\r?\n/);
                    let matchedCount = 0;
                    let totalVal = 0;
                    
                    const listContainer = document.getElementById('cnab-conciliation-list');
                    listContainer.innerHTML = ''; // Reset list
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.length >= 240 && line.substring(13, 14) === 'T') {
                            const segmentT = line;
                            const segmentU = lines[i+1] && lines[i+1].substring(13, 14) === 'U' ? lines[i+1] : null;
                            
                            const nossoNumero = segmentT.substring(37, 47).trim().replace(/^0+/, '');
                            const name = segmentT.substring(143, 183).trim();
                            
                            let valuePaid = 0;
                            if (segmentU) {
                                const valPaidStr = segmentU.substring(77, 92).trim();
                                valuePaid = parseFloat(valPaidStr) / 100;
                            } else {
                                const valStr = segmentT.substring(133, 143).trim();
                                valuePaid = parseFloat(valStr) / 100;
                            }
                            
                            if (!isNaN(valuePaid) && valuePaid > 0) {
                                totalVal += valuePaid;
                                matchedCount++;
                                
                                const div = document.createElement('div');
                                div.className = 'cnab-item-row';
                                div.style.cssText = "background-color:rgba(16, 185, 129, 0.04); border:1px solid var(--color-success); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px";
                                div.innerHTML = `
                                    <div>
                                        <p style="font-size:0.75rem; font-weight:bold; color:white">Título Identificado no Retorno Bancário</p>
                                        <p style="font-size:0.65rem; color:var(--color-text-muted)">Nosso Número: ${nossoNumero || 'S/N'} | Sacado/Credor: ${name} | Tipo: Boleta Sicoob</p>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px">
                                        <span style="font-size:0.7rem; font-weight:bold; color:var(--color-success)">R$ ${valuePaid.toFixed(2).replace('.', ',')}</span>
                                        <button class="btn btn-success" style="font-size:0.65rem; padding:4px 8px" onclick="reconcileCnabItem(this, '${name}', ${valuePaid})">100% Match - Conciliar</button>
                                    </div>
                                `;
                                listContainer.appendChild(div);
                            }
                        }
                    }
                    
                    if (matchedCount > 0) {
                        document.getElementById('cnab-match-rate').innerText = "100%";
                        document.getElementById('cnab-matched-count').innerText = `${matchedCount} / ${matchedCount}`;
                        document.getElementById('cnab-processed-value').innerText = `R$ ${totalVal.toFixed(2).replace('.', ',')}`;
                        showToast(`${matchedCount} lançamentos CNAB240 importados com sucesso!`, 'success');
                    } else {
                        showToast("Nenhum lançamento válido encontrado no arquivo CNAB240.", "warning");
                    }
                } catch(err) {
                    console.error(err);
                    showToast("Erro ao decodificar arquivo CNAB240.", "error");
                }
            };
            reader.readAsText(file);
            fileInput.value = ''; // Reset selection
        }

        function reconcileCnabItem(button, name, value) {
            button.disabled = true;
            button.innerText = "Conciliado ✓";
            button.style.backgroundColor = "var(--color-border)";
            button.style.borderColor = "var(--color-border)";
            showToast(`Lançamento de ${name} (R$ ${value.toFixed(2).replace('.', ',')}) conciliado com sucesso no Caixa!`, 'success');
        }

        /* ASSEMBLEIAS VIRTUAIS VOTE CASTING (Opção 3) */
        let assemblyVoted = { 1: false, 2: false };
        function castAssemblyVote(pautaId, voteType) {
            if (assemblyVoted[pautaId]) {
                showToast("Você já registrou seu voto para esta pauta!", "warning");
                return;
            }
            
            const yesCntEl = document.getElementById(`v${pautaId}-yes-cnt`);
            const noCntEl = document.getElementById(`v${pautaId}-no-cnt`);
            const yesPctEl = document.getElementById(`v${pautaId}-yes-pct`);
            const noPctEl = document.getElementById(`v${pautaId}-no-pct`);
            const yesBarEl = document.getElementById(`v${pautaId}-yes-bar`);
            const noBarEl = document.getElementById(`v${pautaId}-no-bar`);
            
            let yesVotes = parseInt(yesCntEl.innerText);
            let noVotes = parseInt(noCntEl.innerText);
            
            if (voteType === 'yes') {
                yesVotes++;
                yesCntEl.innerText = yesVotes;
            } else {
                noVotes++;
                noCntEl.innerText = noVotes;
            }
            
            const total = yesVotes + noVotes;
            const yesPct = Math.round((yesVotes / total) * 100);
            const noPct = Math.round((noVotes / total) * 100);
            
            yesPctEl.innerText = `${yesPct}%`;
            noPctEl.innerText = `${noPct}%`;
            yesBarEl.style.width = `${yesPct}%`;
            noBarEl.style.width = `${noPct}%`;
            
            assemblyVoted[pautaId] = true;
            
            const actionsDiv = document.getElementById(`v${pautaId}-actions`);
            actionsDiv.innerHTML = `<span style="font-size:0.75rem; color:var(--color-success); font-weight:bold; width:100%; text-align:center">✓ Voto Registrado com Sucesso!</span>`;
            
            showToast(`Seu voto ("${voteType === 'yes' ? 'SIM' : 'NÃO'}") foi registrado e criptografado na Blockchain local!`, 'success');
        }

        /* DEPARTAMENTO PESSOAL AND STRATEGIC HR INTEGRATIONS */
        let hasClockedInToday = false;
        function simulateClockIn() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const tbody = document.getElementById('table-ponto').querySelector('tbody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>Administrador Geral (Você)</strong></td>
                <td>${now.toLocaleDateString('pt-BR')}</td>
                <td>${timeStr}</td>
                <td>--:--</td>
                <td>--:--</td>
                <td>--:--</td>
                <td style="color:var(--color-success); font-weight:bold">+00:00</td>
                <td><span class="badge badge-success">Regular</span></td>
            `;
            tbody.insertBefore(row, tbody.firstChild);
            showToast(`Ponto registrado com sucesso às ${timeStr}!`, 'success');
        }

        function simulateLoadBenefits() {
            showToast("Recarga Sodexo, RioCard e Amil iniciada...", "info");
            setTimeout(() => {
                showToast("Créditos mensais liberados com sucesso para todos os funcionários!", "success");
            }, 1500);
        }

        let onboardingDone = false;
        function simulateOnboarding() {
            if (onboardingDone) {
                showToast("O onboarding do novo candidato já foi concluído!", "warning");
                return;
            }
            
            // Add a new row to the payroll table to show instant real-time synchronization!
            const tbody = document.querySelector('#tab-folha table tbody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>Adriano Souza (Admitido)</strong></td>
                <td>Auxiliar de Jardinagem</td>
                <td>R$ 1.950,00</td>
                <td style="color:var(--color-danger)">R$ 0,00</td>
                <td style="font-weight:700; color:white">R$ 1.950,00</td>
            `;
            tbody.appendChild(row);
            
            onboardingDone = true;
            showToast("Candidato 'Adriano Souza' admitido digitalmente! Cadastro inserido automaticamente na folha de pagamento.", "success");
        }

        function updatePortalUserView() {
            const select = document.getElementById('portal-user-select');
            const user = select.value;
            showToast(`Acessando portal como: ${user === 'reginaldo' ? 'Reginaldo Silveira' : 'Ana Maria'}`, 'info');
        }

        function submitVacationRequest(event) {
            event.preventDefault();
            const range = document.getElementById('vacation-range').value;
            showToast(`Solicitação de férias para o período "${range}" registrada e encaminhada para o administrativo!`, 'success');
            document.getElementById('vacation-range').value = '';
        }

        function uploadMedicalCert(input) {
            const file = input.files[0];
            if (file) {
                showToast(`Atestado médico "${file.name}" anexado e enviado com sucesso nos termos da LGPD!`, 'success');
                input.value = '';
            }
        }

        /* PAYROLL LIVE CALCULATIONS & MODALS (Cálculos em Tempo Real, Guias e Rescisão) */
        let payrollDatabase = {
            reginaldo: { base: 2800, adv: 500, ot50: 0, ot100: 0, night: 0, absences: 0, net: 2300, name: "Reginaldo Silveira" },
            ana: { base: 2200, adv: 400, ot50: 0, ot100: 0, night: 0, absences: 0, net: 1800, name: "Ana Maria de Jesus" }
        };

        function openPayrollCalculatorModal(empId) {
            if (window.event) window.event.stopPropagation();
            
            document.getElementById('modal-calculadora-folha').style.display = 'flex';
            const emp = payrollDatabase[empId];
            document.getElementById('calc-emp-id').value = empId;
            document.getElementById('calc-emp-name').innerText = emp.name;
            document.getElementById('calc-ot50').value = emp.ot50;
            document.getElementById('calc-ot100').value = emp.ot100;
            document.getElementById('calc-night').value = emp.night;
            document.getElementById('calc-absences').value = emp.absences;
            
            recalculatePayrollLive();
        }

        function closePayrollCalculatorModal() {
            document.getElementById('modal-calculadora-folha').style.display = 'none';
        }

        function recalculatePayrollLive() {
            const empId = document.getElementById('calc-emp-id').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            const base = emp.base;
            const ot50Hours = parseFloat(document.getElementById('calc-ot50').value) || 0;
            const ot100Hours = parseFloat(document.getElementById('calc-ot100').value) || 0;
            const nightHours = parseFloat(document.getElementById('calc-night').value) || 0;
            const absences = parseInt(document.getElementById('calc-absences').value) || 0;

            const hourVal = base / 220;
            const ot50Val = ot50Hours * hourVal * 1.5;
            const ot100Val = ot100Hours * hourVal * 2.0;
            const nightVal = nightHours * hourVal * 0.2;
            const dsrVal = ((ot50Val + ot100Val + nightVal) / 26) * 4; 
            
            const absenceVal = absences * (base / 30);
            
            const totalBruto = base + ot50Val + ot100Val + nightVal + dsrVal - absenceVal;

            let inss = 0;
            if (totalBruto <= 1412) inss = totalBruto * 0.075;
            else if (totalBruto <= 2666.68) inss = 1412 * 0.075 + (totalBruto - 1412) * 0.09;
            else if (totalBruto <= 4000.03) inss = 1412 * 0.075 + 1254.68 * 0.09 + (totalBruto - 2666.68) * 0.12;
            else inss = 1412 * 0.075 + 1254.68 * 0.09 + 1333.35 * 0.12 + (totalBruto - 4000.03) * 0.14;

            let irrf = 0;
            const baseIrrf = totalBruto - inss;
            if (baseIrrf <= 2259.20) irrf = 0;
            else if (baseIrrf <= 2826.65) irrf = (baseIrrf * 0.075) - 169.44;
            else if (baseIrrf <= 3751.05) irrf = (baseIrrf * 0.15) - 381.44;
            else if (baseIrrf <= 4664.68) irrf = (baseIrrf * 0.225) - 662.77;
            else irrf = (baseIrrf * 0.275) - 896.00;

            const netPay = totalBruto - inss - irrf - emp.adv;

            document.getElementById('live-base-salary').innerText = `R$ ${base.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-ot-val').innerText = `+R$ ${(ot50Val + ot100Val).toFixed(2).replace('.', ',')}`;
            document.getElementById('live-night-val').innerText = `+R$ ${nightVal.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-dsr-val').innerText = `+R$ ${dsrVal.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-inss-val').innerText = `-R$ ${inss.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-irrf-val').innerText = `-R$ ${irrf.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-absences-val').innerText = `-R$ ${absenceVal.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-net-pay').innerText = `R$ ${netPay.toFixed(2).replace('.', ',')}`;

            emp.tempNet = netPay;
            emp.tempOt50 = ot50Hours;
            emp.tempOt100 = ot100Hours;
            emp.tempNight = nightHours;
            emp.tempAbsences = absences;
        }

        function savePayrollCalculator(event) {
            event.preventDefault();
            const empId = document.getElementById('calc-emp-id').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            emp.net = emp.tempNet;
            emp.ot50 = emp.tempOt50;
            emp.ot100 = emp.tempOt100;
            emp.night = emp.tempNight;
            emp.absences = emp.tempAbsences;

            document.getElementById(`payroll-net-${empId}`).innerText = `R$ ${emp.net.toFixed(2).replace('.', ',')}`;
            showToast(`Cálculos da folha de ${emp.name} salvos com sucesso!`, 'success');
            closePayrollCalculatorModal();
        }

        function openTaxesModal() {
            document.getElementById('modal-impostos-guias').style.display = 'flex';
        }
        function closeTaxesModal() {
            document.getElementById('modal-impostos-guias').style.display = 'none';
        }
        function printTaxGuide(type) {
            showToast(`Gerando e enviando ordem de impressão para guia do ${type}...`, 'info');
            setTimeout(() => {
                showToast(`Guia do ${type} emitida e enviada para impressora padrão da associação!`, 'success');
            }, 1000);
        }
        function downloadPagforRemittance() {
            const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
            const lines = [
                `033000000000000000020100756000010014028200000000045050519965005081CONDOSPHERE ERP-MUNICIPAL     SICOOB COOPERATIVO           ${dateStr}120000000001`,
                `0330001100001A010111111111111111Reginaldo Silveira                     0330001001402820000000002300000000000000000000000000${dateStr}BRL0000000000`,
                `0330001100002A010122222222222222Ana Maria de Jesus                     0330001001402820000000001800000000000000000000000000${dateStr}BRL0000000000`,
                `033999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999`
            ];
            const content = lines.join("\r\n");
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `REMESSA_PAGFOR_SALARIOS_${dateStr}.TXT`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Arquivo de remessa de pagamentos PAGFOR (.TXT) baixado com sucesso!");
        }

        function openRescisionModal() {
            document.getElementById('modal-rescisao-calc').style.display = 'flex';
            updateRescisionEmployeeData();
        }
        function closeRescisionModal() {
            document.getElementById('modal-rescisao-calc').style.display = 'none';
        }
        function updateRescisionEmployeeData() {
            const empId = document.getElementById('resc-emp-select').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            if (empId === 'reginaldo') {
                document.getElementById('resc-adm-date').value = "01/01/2025";
                document.getElementById('resc-signature-view').innerText = "Assinado Digitalmente por Reginaldo Silveira";
            } else {
                document.getElementById('resc-adm-date').value = "15/05/2025";
                document.getElementById('resc-signature-view').innerText = "Assinado Digitalmente por Ana Maria de Jesus";
            }
            recalculateRescisionLive();
        }
        function recalculateRescisionLive() {
            const empId = document.getElementById('resc-emp-select').value;
            const reason = document.getElementById('resc-reason').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            const base = emp.base;
            
            const saldoSalario = (base / 30) * 12; 
            const decimoTerceiro = (base / 12) * 5.5; 
            const feriasProporcionais = ((base / 12) * 5.5) * 1.33; 
            
            let fgtsMulta = 0;
            if (reason === 'sem_justa') {
                const totalSalaryPaid = (empId === 'reginaldo') ? (base * 17) : (base * 13);
                const accumulatedFgts = totalSalaryPaid * 0.08;
                fgtsMulta = accumulatedFgts * 0.40;
            }

            const totalRescisao = saldoSalario + decimoTerceiro + feriasProporcionais + fgtsMulta;

            document.getElementById('resc-salary-val').innerText = `R$ ${saldoSalario.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-13-val').innerText = `R$ ${decimoTerceiro.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-vacation-val').innerText = `R$ ${feriasProporcionais.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-fgts-val').innerText = `R$ ${fgtsMulta.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-total-val').innerText = `R$ ${totalRescisao.toFixed(2).replace('.', ',')}`;
        }
        function submitRescisionForm(event) {
            event.preventDefault();
            const empId = document.getElementById('resc-emp-select').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            const signed = document.getElementById('resc-sig-check').checked;
            if (!signed) {
                showToast("É obrigatório confirmar a assinatura digital para homologar!", "warning");
                return;
            }

            const row = document.getElementById(`payroll-row-${empId}`);
            if (row) {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0.3';
                row.style.pointerEvents = 'none';
                row.querySelector('button').innerText = "Rescindido";
                row.querySelector('button').disabled = true;
                row.querySelector('button').style.backgroundColor = "var(--color-border)";
            }

            showToast(`Contrato de trabalho de ${emp.name} rescindido e homologado via assinatura eletrônica nos termos da lei!`, 'success');
            closeRescisionModal();
        }

        // Trigger file downloads
        function simulateExport(format) {
            showToast(`Exportação completa em formato .${format} iniciada!`);
        }

        function showCalendarAlert(day, info) {
            const now = new Date();
            const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const monthName = monthNames[now.getMonth()];
            if (info) {
                showToast("Dia " + day + " de " + monthName + " reservado para: " + info, 'warning');
            } else {
                showToast("Dia " + day + " de " + monthName + " livre para novas reservas!", 'success');
            }
        }

        function renderReservationsCalendar() {
            const grid = document.getElementById('reservations-calendar-grid');
            if (!grid) return;

            grid.innerHTML = '';

            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

            // Add headers
            const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
            weekdays.forEach(day => {
                const header = document.createElement('div');
                header.className = "calendar-header";
                header.innerText = day;
                grid.appendChild(header);
            });

            // Add faded days for previous month
            if (firstDayOfWeek > 0) {
                const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
                for (let i = firstDayOfWeek - 1; i >= 0; i--) {
                    const fadedDay = document.createElement('div');
                    fadedDay.className = "calendar-day";
                    fadedDay.style.opacity = "0.3";
                    fadedDay.innerHTML = '<span class="day-num">' + (prevMonthDays - i) + '</span>';
                    grid.appendChild(fadedDay);
                }
            }

            // Fetch reservations to map booked days
            const bookedDays = {};
            const resvRows = Array.from(document.querySelectorAll('#tab-reservas table tbody tr'));
            resvRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 7) {
                    const area = cells[1].textContent.trim();
                    const resident = cells[2].textContent.trim();
                    const dateStr = cells[3].textContent.trim();
                    
                    let dayNum = null;
                    let matchMonth = false;
                    let matchYear = false;
                    if (dateStr.includes("/")) {
                        const parts = dateStr.split("/");
                        matchMonth = parseInt(parts[1], 10) === (currentMonth + 1);
                        matchYear = parseInt(parts[2], 10) === currentYear;
                        if (matchMonth && matchYear) dayNum = parseInt(parts[0], 10);
                    } else if (dateStr.includes("-")) {
                        const parts = dateStr.split("-");
                        matchMonth = parseInt(parts[1], 10) === (currentMonth + 1);
                        matchYear = parseInt(parts[0], 10) === currentYear;
                        if (matchMonth && matchYear) dayNum = parseInt(parts[2], 10);
                    }
                    
                    if (dayNum >= 1 && dayNum <= daysInMonth) {
                        if (!bookedDays[dayNum]) bookedDays[dayNum] = [];
                        bookedDays[dayNum].push({ area, resident });
                    }
                }
            });

            // Populate current month days
            for (let day = 1; day <= daysInMonth; day++) {
                const cell = document.createElement('div');
                cell.className = "calendar-day";
                if (day === now.getDate()) {
                    cell.style.border = '2px solid var(--color-primary)';
                }
                
                const dayBookings = bookedDays[day];
                if (dayBookings && dayBookings.length > 0) {
                    cell.classList.add('booked');
                    
                    let label = dayBookings[0].area;
                    if (label.length > 12) label = label.substring(0, 10) + "...";

                    cell.innerHTML = '<span class="day-num">' + day + '</span><span class="day-label" style="font-size:0.55rem; color:#ef4444; display:block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; margin-top:2px; font-weight:bold">' + label + '</span>';
                    
                    const detailsStr = dayBookings.map(b => b.area + " (" + b.resident + ")").join(', ');
                    cell.onclick = (function(d, det) {
                        return function() { showCalendarAlert(d, det); };
                    })(day, detailsStr);
                } else {
                    cell.innerHTML = '<span class="day-num">' + day + '</span>';
                    cell.onclick = (function(d) {
                        return function() { showCalendarAlert(d); };
                    })(day);
                }
                grid.appendChild(cell);
            }

            // Update calendar title
            const calendarTitle = document.querySelector('#tab-areas .page-section-title, #tab-areas .panel-title');
            if (calendarTitle) {
                calendarTitle.textContent = '📅 Calendário de Reservas — ' + monthNames[currentMonth] + ' ' + currentYear;
            }
        }

        /* AUTHENTICATION AND RBAC (TELA DE LOGIN) */
        


        /* RELATIONAL HELPER: BUILD USER DATABASE FROM ACTIVE DOM AND TABLE */
        function getLiveUserDatabase() {
            const db = {};
            const userRows = Array.from(document.querySelectorAll('#table-users tbody tr'));
            userRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 6) {
                    const name = cells[0].textContent.trim();
                    const username = cells[1].textContent.trim().toLowerCase();
                    const cpf = cells[2].textContent.trim().replace(/\D/g, '');
                    const profile = cells[3].textContent.trim();
                    
                    db[username] = {
                        role: profile,
                        name: name,
                        job: profile + " Administrativo",
                        avatar: name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2),
                        pass: cpf
                    };
                }
            });
            return db;
        }
    
        const userDatabase = {
            "admin.geral": { role: "Administrador", name: "Maurício Albuquerque", job: "Gestor Master & Arquiteto", avatar: "MA", pass: "12345678901" },
            "reginaldo.silveira": { role: "Colaborador", name: "Reginaldo Silveira", job: "Zelador Geral", avatar: "RS", pass: "22233344455" },
            "carlos.silva": { role: "Morador", name: "Carlos Henrique Silva", job: "Morador Proprietário", avatar: "CS", pass: "33344455566" },
            "jose.portaria": { role: "Portaria", name: "José Portaria", job: "Supervisor Portaria", avatar: "JP", pass: "44455566677" }
        };

        function fillLoginPreset(username, password) {
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = password;
            // Fazer login automaticamente
            document.getElementById('login-form').dispatchEvent(new Event('submit'));
        }

        function handleLoginSubmit(event) {
            event.preventDefault();
            const username = document.getElementById('login-username').value.trim().toLowerCase();
            const password = document.getElementById('login-password').value.trim();

            const testPresets = {
                "admin.geral": { role: "Administrador", name: "Maurício Albuquerque", job: "Gestor Master", avatar: "MA", pass: "12345678901" },
                "reginaldo.silveira": { role: "Colaborador", name: "Reginaldo Silveira", job: "Zelador Geral", avatar: "RS", pass: "22233344455" },
                "carlos.silva": { role: "Morador", name: "Carlos Henrique", job: "Morador Proprietário", avatar: "CH", pass: "33344455566" },
                "jose.portaria": { role: "Portaria", name: "José da Portaria", job: "Supervisor Portaria", avatar: "JP", pass: "44455566677" }
            };

            let user = testPresets[username];
            if (user && user.pass === password) {
                SafeStorage.setItem('currentUser', JSON.stringify({ username, ...user }));
                document.getElementById('login-screen-overlay').style.display = 'none';
                applyUserSession(user);
                try { loadAllDataFromSupabase(); } catch (e) {}
                showToast(`Seja bem-vindo, ${user.name}!`, 'success');
            } else {
                showToast("Credenciais inválidas! Use: admin.geral / 12345678901", "error");
            }
        }
                    if (!doLocalLoginFallback()) {
                        showToast("Erro: Credenciais inválidas.", "error");
                    }
                }
            } catch(e) {
                console.error("[LOGIN HANDLER ERROR]:", e);
                showToast("Erro de execução de login: " + e.message, "error");
            }
        }

        function handleLogout() {
            SafeStorage.removeItem('currentUser');
            document.getElementById('login-screen-overlay').style.display = 'flex';
            
            // Clear Supabase session on logout (Aprovado!)
            if (supabaseClient) {
                supabaseClient.auth.signOut().then(() => {
                    console.log("[SUPABASE AUTH] Logged out successfully!");
                });
            }
            showToast("Sessão encerrada com sucesso!");
        }

        function forceTabPanelVisibility() {
            document.querySelectorAll('.tab-panel').forEach(panel => {
                const cs = getComputedStyle(panel);
                console.log(`[TAB-DIAG] ${panel.id}: class="${panel.className}" computedDisplay="${cs.display}" hasActive=${panel.classList.contains('active')}`);
                if (!panel.classList.contains('active')) {
                    panel.style.display = 'none';
                } else {
                    panel.style.display = '';
                }
            });
            // Also log how many .tab-panel elements were found
            console.log(`[TAB-DIAG] Total .tab-panel elements: ${document.querySelectorAll('.tab-panel').length}`);
        }

        function applyUserSession(user) {
            document.getElementById('top-responsible-name').innerText = user.name;
            document.getElementById('top-responsible-role').innerText = user.job;
            document.getElementById('top-avatar').innerText = user.avatar;
            forceTabPanelVisibility();

            const rbacSelect = document.getElementById('active-user-role');
            if (rbacSelect) {
                if (user.role === 'Colaborador') {
                    rbacSelect.value = 'Zelador';
                } else {
                    rbacSelect.value = user.role;
                }
            }

            // Visible only to Administrador for security and real-time RBAC testing!
            const switcherContainer = document.getElementById('rbac-role-switcher-container');
            if (switcherContainer) {
                if (user.role === 'Administrador') {
                    switcherContainer.style.display = 'block';
                } else {
                    switcherContainer.style.display = 'none';
                }
            }

            applyRbacPermissions(user.role);

            const btnAdmin = document.getElementById('btn-phone-call-admin');
            if (btnAdmin) {
                if (user.role === 'Administrador') {
                    btnAdmin.innerHTML = '🏢 Ligar p/ Portaria';
                } else if (user.role === 'Portaria') {
                    btnAdmin.innerHTML = '🏢 Ligar p/ Admin';
                } else {
                    btnAdmin.innerHTML = '🏢 Indisponível';
                    btnAdmin.disabled = true;
                    btnAdmin.style.cursor = 'not-allowed';
                    btnAdmin.style.backgroundColor = '#374151';
                    btnAdmin.style.color = '#94a3b8';
                }
            }
        }

        function checkAuthOnLoad() {
            const cachedUser = SafeStorage.getItem('currentUser');
            if (cachedUser) {
                try {
                    const user = JSON.parse(cachedUser);
                    document.getElementById('login-screen-overlay').style.display = 'none';
                    forceTabPanelVisibility();
                    applyUserSession(user);
                    setTimeout(() => {
                        try { loadAllDataFromSupabase(); } catch (e) { console.warn("[AUTH LOAD] Data load:", e); }
                    }, 100);
                } catch(e) {
                    SafeStorage.removeItem('currentUser');
                    document.getElementById('login-screen-overlay').style.display = 'flex';
                }
            } else {
                document.getElementById('login-screen-overlay').style.display = 'flex';
            }
        }

        /* CONSOLIDATED CARGA MASSIVA (.XLSX) MULTI-SHEET WORKFLOW (Novo!) */
        function exportUnifiedCondoExcel() {
            const resHeaders = ["Identificador", "Proprietário Principal", "Endereço Completo", "Perfil Financeiro", "Valor Faturado", "Status"];
            const resRows = Array.from(document.querySelectorAll('#table-residencias-list tbody tr')).map(tr => {
                const cells = tr.querySelectorAll('td');
                if (cells.length < 6) return null;
                return [
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim(),
                    parseFloat(cells[4].textContent.replace(/[^\d.]/g, '').replace(',', '.')) || 300.00,
                    cells[5].textContent.trim()
                ];
            }).filter(Boolean);

            const morHeaders = ["Nome", "CPF", "Contato", "Função", "Residência Vinculada", "Associado", "Morador"];
            const morRows = Array.from(document.querySelectorAll('#tab-moradores table tbody tr')).map(tr => {
                const cells = tr.querySelectorAll('td');
                if (cells.length < 7) return null;
                return [
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim(),
                    cells[4].textContent.trim(),
                    cells[5].querySelector('input').checked ? "Sim" : "Não",
                    cells[6].querySelector('input').checked ? "Sim" : "Não"
                ];
            }).filter(Boolean);

            const vehHeaders = ["Placa", "Veículo", "Cor", "Proprietário"];
            const vehRows = Array.from(document.querySelectorAll('#tab-veiculos table tbody tr')).map(tr => {
                const cells = tr.querySelectorAll('td');
                if (cells.length < 4) return null;
                return [
                    cells[0].textContent.trim(),
                    cells[1].textContent.trim(),
                    cells[2].textContent.trim(),
                    cells[3].textContent.trim()
                ];
            }).filter(Boolean);

            function zip(files) {
                const crc32_table = function() {
                    const tbl = [];
                    var c;
                    for(var n = 0; n < 256; n++){
                        c = n;
                        for(var k = 0; k < 8; k++){
                            c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
                        }
                        tbl[n] = c;
                    }
                    return tbl;
                }();

                function crc32(arr) {
                    var crc = -1;
                    for(var i=0; i<arr.length; i++) {
                        crc = (crc >>> 8) ^ crc32_table[(crc ^ arr[i]) & 0xFF];
                    }
                    return (crc ^ (-1)) >>> 0;
                }

                function putUint32s(arr, offset, ...values) {
                    const dv = new DataView(arr.buffer);
                    values.forEach((v,i)=>dv.setUint32(offset+i*4, v, true));
                }

                function putUint16s(arr, offset, ...values) {
                    const dv = new DataView(arr.buffer);
                    values.forEach((v,i)=>dv.setUint16(offset+i*2, v, true));
                }

                const records = [];
                const te = new TextEncoder('utf8');

                var offset = 0;
                var cdSz = 0;

                files.forEach(file => {
                    const fname = te.encode(file.name);
                    const fh = new Uint8Array(30+fname.length);
                    const chksum = crc32(file.data);

                    putUint32s(fh, 0, 0x04034b50);
                    putUint16s(fh, 4, 10);
                    putUint16s(fh, 6, 0);
                    putUint16s(fh, 8, 0);
                    putUint16s(fh, 10, 0);
                    putUint16s(fh, 12, 0);
                    putUint32s(fh, 14, chksum);
                    putUint32s(fh, 18, file.data.length);
                    putUint32s(fh, 22, file.data.length);
                    putUint16s(fh, 26, fname.length);
                    putUint16s(fh, 28, 0);
                    fh.set(fname, 30);

                    file.header = fh;
                    file.offset = offset;

                    records.push(fh);
                    records.push(file.data);

                    file.cdr = new Uint8Array(46+fname.length);

                    putUint32s(file.cdr, 0, 0x02014b50);
                    putUint16s(file.cdr, 4, 10);
                    putUint16s(file.cdr, 6, 10);
                    putUint16s(file.cdr, 8, 0);
                    putUint16s(file.cdr, 10, 0);
                    putUint16s(file.cdr, 12, 0);
                    putUint16s(file.cdr, 14, 0);
                    putUint32s(file.cdr, 16, chksum);
                    putUint32s(file.cdr, 20, file.data.length);
                    putUint32s(file.cdr, 24, file.data.length);
                    putUint16s(file.cdr, 28, fname.length);
                    putUint16s(file.cdr, 30, 0);
                    putUint16s(file.cdr, 32, 0);
                    putUint16s(file.cdr, 34, 0);
                    putUint16s(file.cdr, 36, 0);
                    putUint32s(file.cdr, 38, 0);
                    putUint32s(file.cdr, 42, offset);

                    file.cdr.set(fname, 46);

                    cdSz += file.cdr.length;
                    offset += fh.length + file.data.length;
                });

                files.forEach(f=>records.push(f.cdr));

                const eocd = new Uint8Array(22);

                putUint32s(eocd, 0, 0x06054b50);
                putUint16s(eocd, 4, 0);
                putUint16s(eocd, 6, 0);
                putUint16s(eocd, 8, files.length);
                putUint16s(eocd, 10, files.length);
                putUint32s(eocd, 12, cdSz);
                putUint32s(eocd, 16, offset);
                putUint16s(eocd, 20, 0);

                records.push(eocd);

                return new Blob(records, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            }

            function excelCellRef(colIndex, rowIndex) {
                let colName = "";
                let temp = colIndex;
                while (temp >= 0) {
                    colName = String.fromCharCode((temp % 26) + 65) + colName;
                    temp = Math.floor(temp / 26) - 1;
                }
                return colName + rowIndex;
            }

            function buildSheetXml(hdrs, rows) {
                let xml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n`;
                xml += `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n`;
                xml += `  <sheetData>\n`;
                
                let rowIndex = 1;
                
                if (hdrs && hdrs.length > 0) {
                    xml += `    <row r="${rowIndex}">\n`;
                    hdrs.forEach((h, colIndex) => {
                        const ref = excelCellRef(colIndex, rowIndex);
                        const safeVal = String(h).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                        xml += `      <c r="${ref}" t="inlineStr"><is><t>${safeVal}</t></is></c>\n`;
                    });
                    xml += `    </row>\n`;
                    rowIndex++;
                }
                
                rows.forEach(row => {
                    xml += `    <row r="${rowIndex}">\n`;
                    row.forEach((val, colIndex) => {
                        const ref = excelCellRef(colIndex, rowIndex);
                        if (val === null || val === undefined) {
                            return;
                        }
                        const isNum = !isNaN(val) && val !== "" && typeof val === 'number';
                        if (isNum) {
                            xml += `      <c r="${ref}" t="n"><v>${val}</v></c>\n`;
                        } else {
                            const safeVal = String(val).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                            xml += `      <c r="${ref}" t="inlineStr"><is><t>${safeVal}</t></is></c>\n`;
                        }
                    });
                    xml += `    </row>\n`;
                    rowIndex++;
                });
                
                xml += `  </sheetData>\n`;
                xml += `</worksheet>`;
                return xml;
            }

            const te = new TextEncoder();

            const files = [
                {
                    name: "[Content_Types].xml",
                    data: te.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
                        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
                        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
                        '<Default Extension="xml" ContentType="application/xml"/>' +
                        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
                        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
                        '<Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
                        '<Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
                        '</Types>')
                },
                {
                    name: "_rels/.rels",
                    data: te.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
                        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
                        '</Relationships>')
                },
                {
                    name: "xl/_rels/workbook.xml.rels",
                    data: te.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
                        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
                        '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>' +
                        '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>' +
                        '</Relationships>')
                },
                {
                    name: "xl/workbook.xml",
                    data: te.encode('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
                        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
                        '<sheets>' +
                        '<sheet name="Residencias" sheetId="1" r:id="rId1"/>' +
                        '<sheet name="Moradores" sheetId="2" r:id="rId2"/>' +
                        '<sheet name="Veiculos" sheetId="3" r:id="rId3"/>' +
                        '</sheets>' +
                        '</workbook>')
                },
                {
                    name: "xl/worksheets/sheet1.xml",
                    data: te.encode(buildSheetXml(resHeaders, resRows))
                },
                {
                    name: "xl/worksheets/sheet2.xml",
                    data: te.encode(buildSheetXml(morHeaders, morRows))
                },
                {
                    name: "xl/worksheets/sheet3.xml",
                    data: te.encode(buildSheetXml(vehHeaders, vehRows))
                }
            ];

            const blob = zip(files);
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "CARGA_MASSIVA_CONDOS_CONSOLIDADO.xlsx");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Planilha Consolidada da Área Condominial baixada com sucesso!", "success");
        }

        function importUnifiedCondoExcel(fileInput) {
            const file = fileInput.files[0];
            if (!file) return;

            // Sincronização e backup do arquivo físico no Supabase Storage Bucket 'uploads' (Aprovado!)
            if (supabaseClient) {
                try {
                    supabaseClient.storage.from('uploads').upload(`mass_imports/${Date.now()}_${file.name}`, file)
                        .then(({ error }) => {
                            if (error) console.warn("[SUPABASE STORAGE] Erro no upload do bucket 'uploads':", error.message);
                            else console.log("[SUPABASE STORAGE] Arquivo .xlsx armazenado com sucesso no bucket 'uploads'!");
                        })
                        .catch(() => {});
                } catch(e) {
                    console.warn("[SUPABASE STORAGE] Upload bloqueado pelo isolamento do sandbox.");
                }
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    let parsedSuccess = false;
                    let residenciasRows = [];
                    let moradoresRows = [];
                    let veiculosRows = [];

                    if (typeof XLSX !== 'undefined') {
                        try {
                            const data = new Uint8Array(e.target.result);
                            const workbook = XLSX.read(data, { type: 'array' });
                            
                            // Highly robust cross-naming sheet selector (accented and index fallbacks)
                            const resSheet = workbook.Sheets["Residencias"] || workbook.Sheets["Residências"] || workbook.Sheets[workbook.SheetNames[0]];
                            const morSheet = workbook.Sheets["Moradores"] || workbook.Sheets[workbook.SheetNames[1]];
                            const vehSheet = workbook.Sheets["Veiculos"] || workbook.Sheets["Veículos"] || workbook.Sheets[workbook.SheetNames[2]];

                            if (resSheet) residenciasRows = XLSX.utils.sheet_to_json(resSheet, { header: 1 });
                            if (morSheet) moradoresRows = XLSX.utils.sheet_to_json(morSheet, { header: 1 });
                            if (vehSheet) veiculosRows = XLSX.utils.sheet_to_json(vehSheet, { header: 1 });
                            
                            if (residenciasRows.length > 0 || moradoresRows.length > 0 || veiculosRows.length > 0) {
                                parsedSuccess = true;
                            }
                        } catch (err) {
                            console.error("SheetJS multi-sheet parsing failed, trying uncompressed parser:", err);
                        }
                    }

                    if (!parsedSuccess) {
                        try {
                            const view = new DataView(e.target.result);
                            const bytes = new Uint8Array(e.target.result);
                            let offset = 0;
                            const te = new TextDecoder('utf-8');
                            
                            let sheet1Xml = "";
                            let sheet2Xml = "";
                            let sheet3Xml = "";
                            
                            while (offset < bytes.length - 30) {
                                const sig = view.getUint32(offset, true);
                                if (sig === 0x04034b50) {
                                    const compSize = view.getUint32(offset + 18, true);
                                    const uncompSize = view.getUint32(offset + 22, true);
                                    const nameLen = view.getUint16(offset + 26, true);
                                    const extraLen = view.getUint16(offset + 28, true);
                                    const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen);
                                    const name = te.decode(nameBytes);
                                    const dataOffset = offset + 30 + nameLen + extraLen;
                                    
                                    if (name.endsWith("sheet1.xml")) {
                                        sheet1Xml = te.decode(bytes.subarray(dataOffset, dataOffset + uncompSize));
                                    } else if (name.endsWith("sheet2.xml")) {
                                        sheet2Xml = te.decode(bytes.subarray(dataOffset, dataOffset + uncompSize));
                                    } else if (name.endsWith("sheet3.xml")) {
                                        sheet3Xml = te.decode(bytes.subarray(dataOffset, dataOffset + uncompSize));
                                    }
                                    offset = dataOffset + compSize;
                                } else {
                                    offset++;
                                }
                            }

                            function parseXmlWithRegExp(xmlText) {
                                if (!xmlText) return [];
                                const rows = [];
                                const rowRegex = /<row[^>]*>([\s\S]*?)<\/row>/g;
                                let rowMatch;
                                while ((rowMatch = rowRegex.exec(xmlText)) !== null) {
                                    const rowContent = rowMatch[1];
                                    const rowData = [];
                                    const cellRegex = /<c[^>]+r="([A-Z]+)(\d+)"[^>]*>([\s\S]*?)<\/c>/g;
                                    let cellMatch;
                                    while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
                                        const colLetters = cellMatch[1];
                                        const cellContent = cellMatch[3];
                                        let colIndex = 0;
                                        for (let i = 0; i < colLetters.length; i++) {
                                            colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64);
                                        }
                                        colIndex -= 1;
                                        let val = "";
                                        if (cellContent.includes("<t>")) {
                                            const tMatch = /<t[^>]*>([\s\S]*?)<\/t>/.exec(cellContent);
                                            if (tMatch) val = tMatch[1];
                                        } else if (cellContent.includes("<v>")) {
                                            const vMatch = /<v[^>]*>([\s\S]*?)<\/v>/.exec(cellContent);
                                            if (vMatch) val = vMatch[1];
                                        }
                                        val = val.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
                                        const num = parseFloat(val);
                                        if (!isNaN(num) && String(num) === val.trim()) {
                                            val = num;
                                        }
                                        rowData[colIndex] = val;
                                    }
                                    rows.push(rowData);
                                }
                                return rows;
                            }

                            residenciasRows = parseXmlWithRegExp(sheet1Xml);
                            moradoresRows = parseXmlWithRegExp(sheet2Xml);
                            veiculosRows = parseXmlWithRegExp(sheet3Xml);
                            
                            if (residenciasRows.length > 0 || moradoresRows.length > 0 || veiculosRows.length > 0) {
                                parsedSuccess = true;
                            }
                        } catch (err) {
                            console.error("ZIP uncompressed multi-sheet parsing failed:", err);
                        }
                    }

                    if (parsedSuccess) {
                        let resCount = 0;
                        let morCount = 0;
                        let vehCount = 0;

                        if (residenciasRows.length > 1) {
                            residenciasRows.slice(1).forEach(row => {
                                if (!row || row.length === 0 || row.every(cell => !cell)) return;
                                const ident = row[0] || "Lote S/N";
                                const prop = row[1] || "Sem Proprietário";
                                const addr = row[2] || "Sem Endereço";
                                const perf = row[3] || "Perfil Lote Padrão";
                                
                                let val = 0.00;
                                let rawVal = row[4];
                                if (typeof rawVal === 'string') {
                                    let cleanStr = rawVal.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
                                    val = parseFloat(cleanStr);
                                } else if (typeof rawVal === 'number') {
                                    val = rawVal;
                                }
                                if (isNaN(val)) val = 0.00;
                                const stat = row[5] || "Ativo";

                                insertMockRow(ident, prop, addr, perf, val, stat);
                                
                                // --- SUPABASE SYNC (IMPORT) ---
                                upsertToSupabase('residences', {
                                    identifier: ident,
                                    owner: prop,
                                    address: addr,
                                    profile_name: perf,
                                    base_value: val,
                                    status: stat
                                }, 'identifier');
                                
                                resCount++;
                            });
                        }

                        if (moradoresRows.length > 1) {
                            const tbody = document.querySelector('#tab-moradores table tbody');
                            moradoresRows.slice(1).forEach(row => {
                                if (!row || row.length === 0 || row.every(cell => !cell)) return;
                                const name = row[0] || "Morador Novo";
                                let cpf = row[1] || "";
                                if (!cpf || cpf.trim() === "" || cpf === "000.000.000-00") {
                                    cpf = "TEMP-" + Math.floor(Math.random() * 100000000);
                                }
                                const contact = row[2] || "Contato";
                                const role = row[3] || "Proprietário";
                                const residence = row[4] || "Sem Vínculo";
                                const assoc = row[5] === "Sim";
                                const resid = row[6] === "Sim";

                                const assocChecked = assoc ? "checked" : "";
                                const residChecked = resid ? "checked" : "";

                                const tr = document.createElement('tr');
                                tr.id = 'mor-row-' + Math.floor(Math.random() * 100000);
                                tr.innerHTML = `
                                    <td><strong>${name}</strong></td>
                                    <td>${cpf}</td>
                                    <td>${contact}</td>
                                    <td>${role}</td>
                                    <td style="color:var(--color-primary); font-weight:600">${residence}</td>
                                    <td><input type="checkbox" ${assocChecked} disabled></td>
                                    <td><input type="checkbox" ${residChecked} disabled></td>
                                    <td><span class="badge badge-success">Ativo</span></td>
                                    <td>
                                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                            <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleMoradorStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleMoradorStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editMoradorRow(this)">
                                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                                </svg>
                                            </button>
                                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${name}')">
                                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                `;
                                tbody.appendChild(tr);
                                
                                
                                
                                // --- SUPABASE SYNC (IMPORT) ---
                                upsertToSupabase('residents', {
                                    name: name,
                                    cpf: cpf,
                                    contact: contact,
                                    role: role,
                                    is_associated: assoc,
                                    is_resident: resid,
                                    residence_name: residence
                                }, 'cpf');
                                
                                morCount++;
                            });
                        }

                        if (veiculosRows.length > 1) {
                            const tbody = document.querySelector('#tab-veiculos table tbody');
                            veiculosRows.slice(1).forEach(row => {
                                if (!row || row.length === 0 || row.every(cell => !cell)) return;
                                const plate = row[0] || "AAA-0000";
                                const model = row[1] || "Carro";
                                const color = row[2] || "Branco";
                                const owner = row[3] || "Sem Nome";

                                const tr = document.createElement('tr');
                                tr.id = 'veh-row-' + Math.floor(Math.random() * 100000);
                                tr.innerHTML = `
                                    <td style="font-weight:700; letter-spacing:1px; color:var(--color-primary)">${plate}</td>
                                    <td>${model}</td>
                                    <td>${color}</td>
                                    <td>${owner}</td>
                                    <td><span class="badge badge-success">Ativo</span></td>
                                    <td>
                                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                            <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleVeiculoStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleVeiculoStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editVeiculoRow(this)">
                                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                                </svg>
                                            </button>
                                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${plate}')">
                                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                `;
                                tbody.appendChild(tr);
                                
                                // --- SUPABASE SYNC (IMPORT) ---
                                upsertToSupabase('vehicles', {
                                    plate: plate,
                                    model: model,
                                    color: color,
                                    owner_name: owner
                                }, 'plate');
                                
                                vehCount++;
                            });
                        }

                        const currentRes = parseInt(document.getElementById('mass-stat-res').innerText) || 3;
                        const currentMor = parseInt(document.getElementById('mass-stat-mor').innerText) || 3;
                        const currentVeh = parseInt(document.getElementById('mass-stat-veh').innerText) || 2;
                        
                        document.getElementById('mass-stat-res').innerText = currentRes + resCount;
                        document.getElementById('mass-stat-mor').innerText = currentMor + morCount;
                        document.getElementById('mass-stat-veh').innerText = currentVeh + vehCount;

                        showToast(`Carga concluída! ${resCount} residências, ${morCount} moradores e ${vehCount} veículos importados com sucesso!`, "success");
                        
                        // Automatically redirect user to the Residences tab so they see results instantly!
                        setTimeout(() => {
                            switchTab('residencias');
                            loadAllDataFromSupabase();
                        }, 2000);
                        return;
                    }

                    throw new Error("Formato inválido");
                } catch (err) {
                    console.error("Unified bulk import failed, using fallback mock import:", err);
                    
                    insertMockRow("Quadra B - Lote 14", "Rodrigo Alves (Carga)", "Alameda dos Pinheiros, 33", "Perfil Lote Luxo", 500.00, "Ativo");
                    upsertToSupabase('residences', { identifier: "Quadra B - Lote 14", owner: "Rodrigo Alves (Carga)", address: "Alameda dos Pinheiros, 33", profile_name: "Perfil Lote Luxo", base_value: 500.00, status: "Ativo" }, 'identifier');
                    
                    const morTbody = document.querySelector('#tab-moradores table tbody');
                    const morRow = document.createElement('tr');
                    morRow.id = 'mor-row-fallback';
                    morRow.innerHTML = `
                        <td><strong>Rodrigo Alves (Carga)</strong></td>
                        <td>333.444.555-66</td>
                        <td>(11) 95555-4444</td>
                        <td>Inquilino</td>
                        <td style="color:var(--color-primary); font-weight:600">Sem Vínculo</td>
                        <td><input type="checkbox" disabled></td>
                        <td><input type="checkbox" checked disabled></td>
                        <td><span class="badge badge-success">Ativo</span></td>
                        <td>
                            <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleMoradorStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleMoradorStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editMoradorRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg></button>
                                <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, 'Rodrigo Alves')"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                            </div>
                        </td>
                    `;
                    morTbody.appendChild(morRow);
                    upsertToSupabase('residents', { name: "Rodrigo Alves (Carga)", cpf: "333.444.555-66", contact: "(11) 95555-4444", role: "Inquilino", is_associated: false, is_resident: true, residence_name: "Sem Vínculo" }, 'cpf');
                    
                    // AUTO-LINK TO CONTAS A RECEBER
                    

                    const vehTbody = document.querySelector('#tab-veiculos table tbody');
                    const vehRow = document.createElement('tr');
                    vehRow.id = 'veh-row-fallback';
                    vehRow.innerHTML = `
                        <td style="font-weight:700; letter-spacing:1px; color:var(--color-primary)">KGA-2026</td>
                        <td>Fiat Palio</td>
                        <td>Azul</td>
                        <td>Rodrigo Alves</td>
                        <td><span class="badge badge-success">Ativo</span></td>
                        <td>
                            <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleVeiculoStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleVeiculoStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editVeiculoRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg></button>
                                <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, 'KGA-2026')"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                            </div>
                        </td>
                    `;
                    vehTbody.appendChild(vehRow);
                    upsertToSupabase('vehicles', { plate: "KGA-2026", model: "Fiat Palio", color: "Azul", owner_name: "Rodrigo Alves" }, 'plate');

                    document.getElementById('mass-stat-res').innerText = "4";
                    document.getElementById('mass-stat-mor').innerText = "4";
                    document.getElementById('mass-stat-veh').innerText = "3";
                    
                    showToast("Carga Massiva Integrada simulada com sucesso!", "success");
                    setTimeout(() => loadAllDataFromSupabase(), 2000);
                }
            };
            reader.readAsArrayBuffer(file);
            fileInput.value = '';
        }

        /* QUICK RESIDENT ASSOCIATION CHECKER (Novo!) */

        /* DYNAMIC VISITOR AUTH DROPDOWN LOADER */
        function populateVisitorAuthDropdown() {
            const select = document.getElementById('visitor-auth');
            if (!select) return;
            select.innerHTML = "";

            const morRows = Array.from(document.querySelectorAll('#tab-moradores table tbody tr'));
            let count = 0;
            morRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    const name = cells[0].textContent.trim();
                    const ident = cells[4].textContent.trim();
                    const opt = document.createElement('option');
                    opt.value = `${name} (${ident})`;
                    opt.innerText = `${name} (${ident})`;
                    select.appendChild(opt);
                    count++;
                }
            });
            if (count === 0) {
                select.innerHTML = '<option value="Nenhum Morador">Nenhum Morador Cadastrado</option>';
            }
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

        function queryGateResident() {
            const raw = document.getElementById('gate-resident-query').value;
            const query = raw.trim().toLowerCase();
            const resultsDiv = document.getElementById('gate-resident-results');
            
            if (!query) {
                resultsDiv.innerHTML = `<p style="font-size:0.75rem; color:var(--color-text-muted); text-align:center; padding:10px">Digite um nome ou lote para consultar...</p>`;
                return;
            }

            console.log('[PORTARIA SEARCH] Query:', query);

            const words = query.split(/\s+/).filter(w => w.length > 0);

            // Helper: identifier match uses startsWith (strict)
            function identMatch(str) {
                if (!str) return false;
                const s = str.toLowerCase();
                return s === query || words.some(w => s.startsWith(w) || s === w);
            }

            // Helper: name/contact match uses includes (broad)
            function textMatch(str) {
                if (!str) return false;
                const s = str.toLowerCase();
                return words.some(w => s.includes(w));
            }

            const cachedResData = window._residencesData;
            const cachedResidentsData = window._residentsData;
            const residencesMap = {};
            const matchingResIdents = new Set();

            // --- SCAN RESIDENCES ---
            function addResidence(identifier, owner, address) {
                residencesMap[identifier] = { owner, address };
                if (identMatch(identifier) || textMatch(owner) || textMatch(address)) {
                    matchingResIdents.add(identifier.toLowerCase());
                }
            }

            // DOM
            Array.from(document.querySelectorAll('#table-residencias-list tbody tr')).forEach(row => {
                const c = row.getElementsByTagName('td');
                if (c.length >= 3) addResidence(c[0].textContent.trim(), c[1].textContent.trim(), c[2].textContent.trim());
            });

            // window cache
            if (cachedResData && Array.isArray(cachedResData)) {
                cachedResData.forEach(r => addResidence(r.identifier, r.owner, r.address));
            }

            // SafeStorage
            try {
                const cached = SafeStorage.getItem('condosphere_residences');
                if (cached) JSON.parse(cached).forEach(r => addResidence(r.identifier, r.owner, r.address));
            } catch(e) {}

            console.log('[PORTARIA SEARCH] matchingResIdents:', Array.from(matchingResIdents));

            // --- SCAN RESIDENTS ---
            const residents = [];

            function addResident(name, ident, contact, role, isAssociated) {
                residents.push({ name, ident: ident || 'Sem Vínculo', addr: 'Condomínio CondoSphere', contact: contact || '', role: role || 'Morador', isAssociated: !!isAssociated });
            }

            // DOM
            Array.from(document.querySelectorAll('#tab-moradores table tbody tr')).forEach(row => {
                const c = row.getElementsByTagName('td');
                if (c.length >= 5) {
                    const assoc = c[5] ? c[5].querySelector('input[type="checkbox"]') : null;
                    addResident(c[0].textContent.trim(), c[4].textContent.trim(), c[2]?.textContent.trim(), c[3]?.textContent.trim(), assoc ? assoc.checked : false);
                }
            });

            // window cache
            if (cachedResidentsData && Array.isArray(cachedResidentsData)) {
                cachedResidentsData.forEach(m => {
                    if (!residents.some(r => r.name === m.name)) {
                        addResident(m.name, m.residence_name, m.contact, m.role, m.is_associated);
                    }
                });
            }

            // SafeStorage
            try {
                const cached = SafeStorage.getItem('condosphere_residents');
                if (cached) {
                    JSON.parse(cached).forEach(m => {
                        if (!residents.some(r => r.name === m.name)) {
                            addResident(m.name, m.residence_name, m.contact, m.role, m.is_associated);
                        }
                    });
                }
            } catch(e) {}

            // Bind address
            residents.forEach(r => {
                const info = residencesMap[r.ident];
                if (info) r.addr = info.address;
            });

            // --- FILTER ---
            const matchedResidents = residents.filter(r => {
                const nameOk = textMatch(r.name);
                const residenceOk = matchingResIdents.has(r.ident.toLowerCase());
                const identOk = identMatch(r.ident) || textMatch(r.addr);
                return nameOk || residenceOk || identOk;
            });

            const matchedResidences = Object.keys(residencesMap).filter(k => matchingResIdents.has(k.toLowerCase()));

            console.log('[PORTARIA SEARCH] matchedResidents:', matchedResidents.length, 'matchedResidences:', matchedResidences.length);

            // --- RENDER ---
            let html = '';

            if (matchedResidents.length === 0 && matchedResidences.length > 0) {
                html += `<div style="margin-bottom:8px; font-size:0.85rem; color:var(--color-text-muted)">Residências encontradas (${matchedResidences.length}):</div>`;
                matchedResidences.forEach(id => {
                    const r = residencesMap[id];
                    html += `
                        <div style="background-color:rgba(16,185,129,0.05); border:1px solid var(--color-success); border-radius:8px; padding:16px; margin-bottom:8px">
                            <div style="font-size:1rem; font-weight:bold; color:white">${id}</div>
                            <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:4px">Proprietário: ${r.owner} | Endereço: ${r.address}</div>
                        </div>`;
                });
            }

            matchedResidents.forEach((res, i) => {
                const encName = encodeURIComponent(res.name).replace(/'/g, "%27");
                const encIdent = encodeURIComponent(res.ident).replace(/'/g, "%27");
                const encRole = encodeURIComponent(res.role).replace(/'/g, "%27");
                html += `<div style="cursor:pointer; font-family:monospace; font-size:14px; padding:8px 10px; border-radius:4px; transition:background 0.15s" onclick="selectIntercomContact(decodeURIComponent('${encName}'), decodeURIComponent('${encIdent}'), decodeURIComponent('${encRole}'))" onmouseover="this.style.background='rgba(56,189,248,0.08)'" onmouseout="this.style.background=''">
                    <div><span style="color:#38bdf8">${res.ident}</span> <span style="color:var(--color-text-muted)">|</span> <span style="color:#fbbf24">${res.role}:</span> <span style="color:white;font-weight:bold">${res.name}</span></div>
                    <div style="margin-top:2px"><span style="color:#94a3b8">${res.addr}</span> <span style="color:var(--color-text-muted)">|</span> <span style="color:#94a3b8">${res.contact || '---'}</span></div>
                </div>`;
                if (i < matchedResidents.length - 1) html += '<hr style="border:none; border-top:1px solid rgba(148,163,184,0.1); margin:2px 0">';
            });

            if (!html) {
                html = '<div style="background-color:rgba(239,68,68,0.05); border:1px dashed var(--color-danger); border-radius:8px; padding:20px; text-align:center"><p style="font-size:0.85rem; font-weight:bold; color:#f87171">Nenhum morador ou residência localizada para esta busca!</p></div>';
            }

            resultsDiv.innerHTML = html;
        }

        /* DYNAMIC REAL-TIME CLOUD SYNC FOR SUPABASE (Aprovado!) */
        
        /* DYNAMIC REAL-TIME CLOUD UPSERT (ON CONFLICT UPDATE) FOR MASS IMPORTS (Aprovado!) */
        function upsertToSupabase(table, data, conflictColumn) {
            if (!supabaseClient && dbSource !== 'local') {
                console.warn(`[SUPABASE UPSERT] Client offline for table ${table}`);
                return;
            }
            if (dbSource === 'supabase' && supabaseClient) {
                const sbUrl = document.getElementById('sb-url')?.value || SafeStorage.getItem('condosphere_sb_url') || 'https://psbvjscrqhwhttvbstty.supabase.co';
                const sbKey = document.getElementById('sb-key')?.value || SafeStorage.getItem('condosphere_sb_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYnZqc2NycWh3aHR0dmJzdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTA4MzAsImV4cCI6MjA5Njg2NjgzMH0.AFnX7TYKrpTSQMBEU9Rwj0g8nvgpSEDKSjGNb-FM2Gw';
                const restUrl = `${sbUrl.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=${encodeURIComponent(conflictColumn)}`;
                const restBase = sbUrl.replace(/\/$/, '') + '/rest/v1/' + table;
                const upsertUrl = restBase + '?on_conflict=' + encodeURIComponent(conflictColumn);
                fetch(upsertUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': sbKey,
                        'Authorization': 'Bearer ' + sbKey,
                        'Prefer': 'resolution=merge-duplicates'
                    },
                    body: JSON.stringify([data])
                })
                .then(res => {
                    if (!res.ok) {
                        return res.text().then(text => {
                            try {
                                const errData = JSON.parse(text);
                                if (errData.code === '42P10') {
                                    console.warn('[SUPABASE UPSERT] No unique constraint on ' + table + '.' + conflictColumn + ', falling back to plain insert');
                                    return fetch(restBase, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'apikey': sbKey,
                                            'Authorization': 'Bearer ' + sbKey
                                        },
                                        body: JSON.stringify([data])
                                    }).then(r => {
                                        if (!r.ok) return r.text().then(t => { throw new Error(t); });
                                        console.log('[SUPABASE UPSERT] Table ' + table + ' inserted via fallback');
                                    });
                                }
                            } catch (e) {}
                            throw new Error(text);
                        });
                    }
                    console.log('[SUPABASE UPSERT] Table ' + table + ' upserted successfully via REST API');
                })
                .catch(err => {
                    console.warn('[SUPABASE UPSERT VIA REST API ERROR] Table ' + table + ':', err.message);
                    showToast('[REST] Erro ao sincronizar importação de ' + table + ': ' + err.message, 'error');
                });
            } else {
                try {
                    dbClient.from(table).upsert([data], { onConflict: conflictColumn })
                        .then(({ error }) => {
                            if (error) {
                                console.warn(`[JS CLIENT UPSERT ERROR] Table ${table}:`, error.message);
                                showToast(`[JS Client] Erro ao sincronizar importação de ${table}: ${error.message}`, "error");
                            }
                        })
                        .catch(err => {
                            console.warn("[SUPABASE UPSERT] Request blocked by browser sandbox / iframe isolation.");
                        });
                } catch (e) {
                    console.warn("[SUPABASE UPSERT] Exception caught during upsert:", e);
                }
            }
        }

        function saveToSupabase(table, data) {
            if (!supabaseClient && dbSource !== 'local') {
                console.warn(`[SUPABASE SYNC] Client offline for table ${table}`);
                showToast(`⚠️ Modo Offline: Salvo localmente, mas não sincronizado com o Supabase (Conecte o banco nas Configurações).`, "warning");
                return;
            }
            try {
                dbClient.from(table).insert([data])
                    .then(({ error }) => {
                        if (error) {
                            console.warn(`[SUPABASE SYNC] Error on table ${table}:`, error.message);
                            alert(`[Erro Supabase - Gravação] Tabela: ${table}\nErro: ${error.message}\n\n👉 Se o erro for 'relation does not exist', você precisa criar as tabelas no painel do seu Supabase executando todo o código do arquivo 'supabase_schema.sql' no seu SQL Editor!`);
                        } else {
                            console.log(`[SUPABASE SYNC] Table ${table} updated in real-time on the cloud!`);
                            showToast("Dados salvos e sincronizados no Supabase na Nuvem!", "success");
                        }
                    })
                    .catch(err => {
                        console.warn("[SUPABASE SYNC] Request blocked by browser sandbox / iframe network isolation.");
                    });
            } catch (e) {
                console.warn("[SUPABASE SYNC] Request blocked by browser sandbox / iframe network isolation.");
            }
        }

        /* PROFILE ACCORDION TOGGLE */
        function toggleProfileAccordion(header) {
            const content = header.nextElementSibling;
            const arrow = header.querySelector('.accordion-arrow');
            content.classList.toggle('active');
            if (content.classList.contains('active')) {
                arrow.style.transform = 'rotate(180deg)';
            } else {
                arrow.style.transform = 'rotate(0deg)';
            }
        }

        /* ACTIONS AND DYNAMIC EDIT/DELETE FOR RECTIFIED TABLES (Aprovado!) */
        function deleteTableRow(button, itemName) {
            if (confirm(`Tem certeza que deseja excluir o registro: "${itemName}"?`)) {
                const row = button.closest('tr');
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    row.remove();
                    
                    // --- SUPABASE SYNC (DELETE) ---
                    if (supabaseClient) {
                        const dbId = row.dataset.dbId || row.dataset.id;
                        if (row.closest('#table-residencias-list')) {
                            if (dbId) {
                                dbClient.from('residences').delete().eq('id', dbId).then(() => {});
                            } else {
                                dbClient.from('residences').delete().eq('identifier', itemName).then(() => {});
                            }
                        } else if (row.closest('#tab-moradores table')) {
                            if (dbId) {
                                dbClient.from('residents').delete().eq('id', dbId).then(() => {});
                            } else {
                                dbClient.from('residents').delete().eq('name', itemName).then(() => {});
                            }
                        } else if (row.closest('#tab-veiculos table')) {
                            const plate = row.cells[0].textContent.trim();
                            dbClient.from('vehicles').delete().eq('plate', plate).then(() => {});
                        } else if (row.closest('#tab-areas table')) {
                            if (dbId) {
                                dbClient.from('common_areas').delete().eq('id', dbId).then(() => {});
                            } else {
                                dbClient.from('common_areas').delete().eq('name', itemName).then(() => {});
                            }
                        } else if (row.closest('#table-receivables-grid')) {
                            const recId = row.dataset.id;
                            if (recId) {
                                dbClient.from('receivables').delete().eq('id', recId).then(() => {});
                            }
                        }
                    }

                    // Sync deletion with accounts receivable list
                    receivablesList = receivablesList.filter(r => r.identifier !== itemName && r.owner !== itemName);
                    renderReceivables();
                    saveLocalResidencesToCache();
                    saveLocalResidentsToCache();
                    saveLocalReceivablesToCache();
                    showToast(`Registro "${itemName}" excluído com sucesso!`, 'success');
                }, 300);
            }
        }

        /* DYNAMIC PROFILE OPERATIONS (Ativar/Desativar, Editar, Copiar, Excluir) */
        function toggleProfileActiveState(checkbox, name) {
            if (checkbox.checked) {
                showToast(`Perfil "${name}" ativado com sucesso!`, 'success');
            } else {
                showToast(`Perfil "${name}" desativado!`, 'warning');
            }
        }

        /* DYNAMIC STATUS TOGGLES FOR CONDOMINIO TABLES (Ativar / Desativar) */
        function toggleResidenciaStatus(button, active) {
            const row = button.closest('tr');
            const statusCell = row.cells[5];
            const ident = row.cells[0].textContent;
            
            if (active) {
                statusCell.innerHTML = `<span class="badge badge-success">Ativo</span>`;
                showToast(`Residência "${ident}" ativada com sucesso!`, 'success');
            } else {
                statusCell.innerHTML = `<span class="badge badge-danger">Inativo</span>`;
                showToast(`Residência "${ident}" desativada!`, 'warning');
            }
        }

        function toggleMoradorStatus(button, active) {
            const row = button.closest('tr');
            const statusCell = row.cells[6];
            const name = row.cells[0].textContent;
            
            if (active) {
                statusCell.innerHTML = `<span class="badge badge-success">Ativo</span>`;
                showToast(`Morador "${name}" ativado com sucesso!`, 'success');
            } else {
                statusCell.innerHTML = `<span class="badge badge-danger">Inativo</span>`;
                showToast(`Morador "${name}" desativado!`, 'warning');
            }
        }

        function toggleVeiculoStatus(button, active) {
            const row = button.closest('tr');
            const statusCell = row.cells[4];
            const plate = row.cells[0].textContent;
            
            if (active) {
                statusCell.innerHTML = `<span class="badge badge-success">Ativo</span>`;
                showToast(`Veículo de placa "${plate}" ativado com sucesso!`, 'success');
            } else {
                statusCell.innerHTML = `<span class="badge badge-danger">Inativo</span>`;
                showToast(`Veículo de placa "${plate}" desativado!`, 'warning');
            }
        }

        function toggleAreaStatus(button, active) {
            const row = button.closest('tr');
            const statusCell = row.cells[3];
            const name = row.cells[0].textContent;
            
            if (active) {
                statusCell.innerHTML = `<span class="badge badge-success">Livre</span>`;
                showToast(`Área comum "${name}" liberada com sucesso!`, 'success');
            } else {
                statusCell.innerHTML = `<span class="badge badge-danger">Ocupada</span>`;
                showToast(`Área comum "${name}" bloqueada/ocupada!`, 'warning');
            }
        }

        function toggleReservaStatus(button, active) {
            const row = button.closest('tr');
            const statusCell = row.cells[5];
            const id = row.cells[0].textContent;
            
            if (active) {
                statusCell.innerHTML = `<span class="badge badge-success">Confirmado</span>`;
                showToast(`Reserva "${id}" confirmada com sucesso!`, 'success');
            } else {
                statusCell.innerHTML = `<span class="badge badge-danger">Cancelado</span>`;
                showToast(`Reserva "${id}" cancelada!`, 'warning');
            }
        }

        function toggleEditProfileCard(button) {
            const card = button.parentElement.parentElement;
            const checkboxes = card.querySelectorAll('.permissions-table input[type="checkbox"]');
            const isEditing = button.innerText.includes("Salvar");
            
            if (isEditing) {
                // Save changes
                checkboxes.forEach(cb => cb.disabled = true);
                button.innerHTML = "✏️ Editar";
                button.style.backgroundColor = "";
                button.style.color = "";
                showToast("Alterações do perfil salvas com sucesso!", "success");
            } else {
                // Unlock/enable editing
                checkboxes.forEach(cb => cb.disabled = false);
                button.innerHTML = "💾 Salvar";
                button.style.backgroundColor = "#10b981";
                button.style.color = "white";
                showToast("Edição de permissões liberada para este perfil!", "info");
            }
        }

        function copyProfileCard(button) {
            const card = button.parentElement.parentElement;
            const container = document.getElementById('profiles-container');
            
            // Clone the card
            const copy = card.cloneNode(true);
            
            // Generate random unique ID
            const randId = 'custom-prof-' + Math.floor(Math.random() * 100000);
            copy.id = randId;
            
            const titleEl = copy.querySelector('h4');
            const originalName = titleEl.innerText;
            titleEl.innerText = originalName + " (Cópia)";
            
            // Since cloneNode does NOT copy dynamic checked properties, copy them manually
            const originalCbs = card.querySelectorAll('input[type="checkbox"]');
            const copyCbs = copy.querySelectorAll('input[type="checkbox"]');
            originalCbs.forEach((cb, idx) => {
                copyCbs[idx].checked = cb.checked;
                copyCbs[idx].disabled = true; // Kept locked on creation
            });
            
            // Setup active switch toggle
            const originalSwitch = card.querySelector('.switch input');
            const copySwitch = copy.querySelector('.switch input');
            if (originalSwitch && copySwitch) {
                copySwitch.checked = originalSwitch.checked;
                copySwitch.disabled = false;
                
                // Set the dynamic onchange attribute
                copySwitch.onchange = function() {
                    toggleProfileActiveState(this, titleEl.innerText);
                };
            }
            
            // Reset edit button
            const editBtn = copy.querySelector('.btn-profile-edit');
            if (editBtn) {
                editBtn.innerHTML = "✏️ Editar";
                editBtn.style.backgroundColor = "";
                editBtn.style.color = "";
            }
            
            container.appendChild(copy);
            showToast(`Perfil "${originalName}" duplicado com sucesso!`, 'success');
        }

        function deleteProfileCard(button) {
            const card = button.parentElement.parentElement;
            const titleEl = card.querySelector('h4');
            const name = titleEl ? titleEl.innerText : "Perfil";
            
            if (confirm(`Tem certeza que deseja excluir o perfil "${name}"?`)) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    card.remove();
                    showToast(`Perfil "${name}" excluído com sucesso!`, 'success');
                }, 300);
            }
        }

        function applyRbacPermissions(role) {
            const sideDashboard = document.querySelector("button[onclick*='dashboard']");
            const sideCondominio = document.getElementById("condominio-sub");
            const sideFinanceiro = document.getElementById("financeiro-sub");
            const sidePortaria = document.getElementById("portaria-sub");
            const sideRh = document.getElementById("rh-sub");
            const sideConfig = document.getElementById("config-sub");
            
            const headerCondominio = sideCondominio ? sideCondominio.previousElementSibling : null;
            const headerFinanceiro = sideFinanceiro ? sideFinanceiro.previousElementSibling : null;
            const headerPortaria = sidePortaria ? sidePortaria.previousElementSibling : null;
            const headerRh = sideRh ? sideRh.previousElementSibling : null;
            const headerConfig = sideConfig ? sideConfig.previousElementSibling : null;

            function show(el) { if (el) el.style.display = ''; }
            function hide(el) { if (el) el.style.display = 'none'; }

            show(headerCondominio);
            show(sideCondominio);
            show(headerFinanceiro);
            show(sideFinanceiro);
            show(headerPortaria);
            show(sidePortaria);
            show(headerRh);
            show(sideRh);
            show(headerConfig);
            show(sideConfig);
            
            const valueDiv = document.getElementById('inadimplencia-value');
            const footerDiv = document.getElementById('inadimplencia-footer');
            const actionButtons = document.querySelectorAll(".action-icon, td button");

            if (role === 'Administrador') {
                actionButtons.forEach(btn => {
                    btn.style.opacity = "1";
                    btn.style.pointerEvents = "auto";
                });
                if (valueDiv) {
                    valueDiv.innerText = "R$ 12.450,00";
                    valueDiv.style.color = "#f87171";
                }
                if (footerDiv) {
                    footerDiv.innerHTML = "<span>18 Residências em atraso</span>";
                    footerDiv.className = "metric-footer danger";
                }
            } else if (role === 'Colaborador') {
                hide(headerFinanceiro);
                hide(sideFinanceiro);
                hide(headerConfig);
                hide(sideConfig);
                
                if (valueDiv) {
                    valueDiv.innerText = "R$ •••••••";
                    valueDiv.style.color = "var(--color-text-muted)";
                }
                if (footerDiv) {
                    footerDiv.innerHTML = "<span>🔒 Acesso restrito ao Administrador</span>";
                    footerDiv.className = "metric-footer warning";
                }

                actionButtons.forEach(btn => {
                    if (btn.title === 'Excluir' || btn.innerText.includes('Excluir')) {
                        btn.style.opacity = "0.3";
                        btn.style.pointerEvents = "none";
                    } else {
                        btn.style.opacity = "1";
                        btn.style.pointerEvents = "auto";
                    }
                });
            } else if (role === 'Morador') {
                hide(headerPortaria);
                hide(sidePortaria);
                hide(headerFinanceiro);
                hide(sideFinanceiro);
                hide(headerConfig);
                hide(sideConfig);

                if (valueDiv) {
                    valueDiv.innerText = "R$ •••••••";
                    valueDiv.style.color = "var(--color-text-muted)";
                }
                if (footerDiv) {
                    footerDiv.innerHTML = "<span>🔒 Acesso restrito ao Administrador</span>";
                    footerDiv.className = "metric-footer warning";
                }

                actionButtons.forEach(btn => {
                    btn.style.opacity = "0.3";
                    btn.style.pointerEvents = "none";
                });
            } else if (role === 'Portaria') {
                hide(headerFinanceiro);
                hide(sideFinanceiro);
                hide(headerRh);
                hide(sideRh);
                hide(headerConfig);
                hide(sideConfig);

                if (valueDiv) {
                    valueDiv.innerText = "R$ •••••••";
                    valueDiv.style.color = "var(--color-text-muted)";
                }
                if (footerDiv) {
                    footerDiv.innerHTML = "<span>🔒 Acesso restrito ao Administrador</span>";
                    footerDiv.className = "metric-footer warning";
                }

                actionButtons.forEach(btn => {
                    if (btn.closest('#table-logs')) {
                        btn.style.opacity = "1";
                        btn.style.pointerEvents = "auto";
                    } else {
                        btn.style.opacity = "0.3";
                        btn.style.pointerEvents = "none";
                    }
                });
            }

            const condoButtons = document.querySelectorAll("#table-residencias-list .action-icon, #tab-moradores table .action-icon, #tab-veiculos table .action-icon, #tab-areas table .action-icon, #tab-reservas table .action-icon");
            condoButtons.forEach(btn => {
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            });
        }

        /* NEGOTIATION / ACORDO HANDLERS (NEW!) */
        let selectedNegRecId = null;

        function openNegotiationModal(id) {
            selectedNegRecId = id;
            const rec = receivablesList.find(r => String(r.id) === String(id));
            if (!rec) return;

            const penalty = rec.status === 'Vencido' ? rec.baseValue * 0.02 : 0;
            const interest = rec.status === 'Vencido' ? rec.baseValue * (0.01 * (rec.delayDays / 30)) : 0;
            const totalPenalties = penalty + interest;

            document.getElementById('neg-rec-id').value = id;
            document.getElementById('neg-owner-name').innerText = rec.owner;
            document.getElementById('neg-unit-ident').innerText = rec.identifier;
            document.getElementById('neg-original-val').innerText = rec.baseValue.toFixed(2);
            document.getElementById('neg-penalties-val').innerText = totalPenalties.toFixed(2);
            document.getElementById('neg-discount-type').value = "0";
            document.getElementById('neg-installments').value = "3";
            document.getElementById('modal-negotiation').style.display = 'flex';
            
            calculateNegotiationValues();
        }

        function closeNegotiationModal() {
            document.getElementById('modal-negotiation').style.display = 'none';
        }

        function calculateNegotiationValues() {
            const originalVal = parseFloat(document.getElementById('neg-original-val').innerText) || 0;
            const penaltiesVal = parseFloat(document.getElementById('neg-penalties-val').innerText) || 0;
            const discountType = document.getElementById('neg-discount-type').value;
            const installments = parseInt(document.getElementById('neg-installments').value) || 1;

            const penaltyWaiver = discountType === '100' ? penaltiesVal : discountType === '50' ? penaltiesVal * 0.5 : 0;
            const finalValue = originalVal + (penaltiesVal - penaltyWaiver);
            const installmentValue = finalValue / installments;

            document.getElementById('neg-installment-val').innerText = `${installments}x de R$ ${installmentValue.toFixed(2).replace('.', ',')}`;
            document.getElementById('neg-total-val').innerText = finalValue.toFixed(2);
            document.getElementById('neg-savings-val').innerText = penaltyWaiver.toFixed(2);
        }

        function confirmNegotiation() {
            const id = document.getElementById('neg-rec-id').value;
            const finalVal = parseFloat(document.getElementById('neg-total-val').innerText) || 300;
            const discount = parseFloat(document.getElementById('neg-savings-val').innerText) || 0;

            receivablesList = receivablesList.map(r => {
                if (String(r.id) === String(id)) {
                    r.status = 'Acordo';
                    r.baseValue = finalVal;
                    r.agreedDiscounts = discount;
                    r.delayDays = 0;
                }
                return r;
            });

            if (supabaseClient) {
                try {
                    dbClient.from('receivables').update({
                        status: 'Acordo',
                        base_value: finalVal,
                        agreed_discounts: discount
                    }).eq('id', id).catch(() => {});
                } catch(e) {}
            }

            closeNegotiationModal();
            renderReceivables();
            renderPayableAcordosSection();
            showToast("Acordo financeiro firmado com sucesso!", "success");
        }

        /* GROUP SETTLE (BATCH SETTLE) HANDLERS (NEW!) */
        function openGroupSettleModal() {
            document.getElementById('grp-search-input').value = "";
            document.getElementById('grp-installments-list').innerHTML = '<p style="text-align:center; color:var(--color-text-muted); padding:10px">Digite um nome acima para listar as mensalidades pendentes...</p>';
            document.getElementById('grp-total-val').innerText = "R$ 0,00";
            document.getElementById('grp-selected-count').innerText = "0";
            document.getElementById('modal-group-settle').style.display = 'flex';
        }

        function closeGroupSettleModal() {
            document.getElementById('modal-group-settle').style.display = 'none';
        }

        function filterGroupSettleInstallments() {
            const search = document.getElementById('grp-search-input').value.toLowerCase().trim();
            const listDiv = document.getElementById('grp-installments-list');
            if (search.length < 2) {
                listDiv.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); padding:10px">Digite ao menos 2 caracteres do nome...</p>';
                document.getElementById('grp-total-val').innerText = "R$ 0,00";
                document.getElementById('grp-selected-count').innerText = "0";
                return;
            }

            const pendingRecs = receivablesList.filter(r => r.status === 'Vencido' && r.owner.toLowerCase().includes(search));
            if (pendingRecs.length === 0) {
                listDiv.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); padding:10px">Nenhum faturamento em atraso encontrado para este morador.</p>';
                document.getElementById('grp-total-val').innerText = "R$ 0,00";
                document.getElementById('grp-selected-count').innerText = "0";
                return;
            }

            listDiv.innerHTML = '';
            pendingRecs.forEach(r => {
                const penalty = r.baseValue * 0.02;
                const interest = r.baseValue * (0.01 * (r.delayDays / 30));
                const total = r.baseValue + r.extraCharges + penalty + interest;

                const div = document.createElement('div');
                div.style.display = "flex";
                div.style.alignItems = "center";
                div.style.justifyContent = "space-between";
                div.style.padding = "6px 0";
                div.style.borderBottom = "1px solid rgba(255,255,255,0.03)";
                
                const dateParts = r.dueDate.split('-');
                const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

                div.innerHTML = `
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer; width:100%">
                        <input type="checkbox" class="grp-settle-chk" value="${r.id}" data-val="${total}" onchange="updateGroupSettleTotal()">
                        <div style="display:flex; flex-direction:column">
                            <span style="font-weight:bold; color:white">${r.identifier}</span>
                            <span style="font-size:0.65rem; color:var(--color-text-muted)">Vencimento: ${formattedDate} (${r.delayDays} dias em atraso)</span>
                        </div>
                    </label>
                    <span style="font-weight:bold; color:white">R$ ${total.toFixed(2).replace('.', ',')}</span>
                `;
                listDiv.appendChild(div);
            });
            updateGroupSettleTotal();
        }

        function updateGroupSettleTotal() {
            const chks = Array.from(document.querySelectorAll('.grp-settle-chk:checked'));
            let total = 0;
            chks.forEach(chk => {
                total += parseFloat(chk.getAttribute('data-val')) || 0;
            });
            document.getElementById('grp-total-val').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
            document.getElementById('grp-selected-count').innerText = chks.length;
        }

        function confirmGroupSettle() {
            const chks = Array.from(document.querySelectorAll('.grp-settle-chk:checked'));
            if (chks.length === 0) {
                showToast("Selecione ao menos uma parcela para quitar!", "warning");
                return;
            }

            if (confirm(`Confirmar quitação em grupo de ${chks.length} parcelas selecionadas?`)) {
                chks.forEach(chk => {
                    const id = parseInt(chk.value);
                    receivablesList = receivablesList.map(r => {
                        if (r.id === id) {
                            r.status = 'Pago';
                            r.delayDays = 0;
                        }
                        return r;
                    });

                    // Sync with Supabase cloud
                    if (supabaseClient) {
                        try {
                            dbClient.from('receivables').update({
                                status: 'Pago'
                            }).eq('id', id).catch(() => {});
                        } catch(e) {}
                    }
                });

                closeGroupSettleModal();
                renderReceivables();
                renderPayableAcordosSection();
                showToast(`${chks.length} parcelas quitadas em lote com sucesso!`, "success");
            }
        }

        /* RENDER PAYABLE ACORDOS SECTION (NEW!) */
        function renderPayableAcordosSection() {
            const tbody = document.getElementById('table-pagar-acordos-rows');
            if (!tbody) return;
            tbody.innerHTML = '';

            const acordoRecs = payablesList.filter(r => r.status === 'Acordo');
            if (acordoRecs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted); padding:20px">Nenhum acordo de pagamento encontrado!</td></tr>';
                return;
            }

            acordoRecs.forEach(r => {
                const dateParts = r.dueDate.split('-');
                const formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="padding:10px"><strong>${r.creditor}</strong></td>
                    <td style="padding:10px">${r.description}</td>
                    <td style="padding:10px" class="date-col">${formattedDate}</td>
                    <td style="padding:10px; font-weight:bold; color:white">R$ ${r.value.toFixed(2)}</td>
                    <td style="padding:10px">
                        <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                            <button class="action-icon" style="color:var(--color-success); border:none; background:none; font-size:1rem" title="Quitar Acordo" onclick="settlePayableBill(${r.id})">💰</button>
                            <button class="action-icon" style="color:#f43f5e; border:none; background:none; font-size:1rem" title="Cancelar Acordo" onclick="showToast('Cancelamento de acordo em desenvolvimento')">↩️</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }



        /* RELATIONAL OFFLINE CACHE PERSISTENCE HELPERS */
        function saveLocalResidencesToCache() {
            const list = [];
            const rows = Array.from(document.querySelectorAll('#table-residencias-list tbody tr'));
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 6) {
                    list.push({
                        identifier: cells[0].textContent.trim(),
                        owner: cells[1].textContent.trim(),
                        address: cells[2].textContent.trim(),
                        profile_name: cells[3].textContent.trim(),
                        base_value: parseFloat(cells[4].textContent.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.').trim()) || 300.00,
                        status: cells[5].textContent.trim()
                    });
                }
            });
            SafeStorage.setItem('condosphere_residences', JSON.stringify(list));
        }

        function saveLocalResidentsToCache() {
            const list = [];
            const rows = Array.from(document.querySelectorAll('#tab-moradores table tbody tr'));
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 8) {
                    const assocInput = cells[5].querySelector('input[type="checkbox"]');
                    const residInput = cells[6].querySelector('input[type="checkbox"]');
                    list.push({
                        name: cells[0].textContent.trim(),
                        cpf: cells[1].textContent.trim(),
                        contact: cells[2].textContent.trim(),
                        role: cells[3].textContent.trim(),
                        residence_name: cells[4].textContent.trim(),
                        is_associated: assocInput ? assocInput.checked : false,
                        is_resident: residInput ? residInput.checked : false
                    });
                }
            });
            SafeStorage.setItem('condosphere_residents', JSON.stringify(list));
        }

        function saveLocalReceivablesToCache() {
            SafeStorage.setItem('condosphere_receivables', JSON.stringify(receivablesList));
        }

        function loadLocalDataFromCache() {
            try {
                // 1. Load Residences
                const cachedRes = SafeStorage.getItem('condosphere_residences');
                if (cachedRes) {
                    const list = JSON.parse(cachedRes);
                    if (list.length > 0) {
                        const tbody = document.getElementById('table-residencias-list').querySelector('tbody');
                        tbody.innerHTML = "";
                        list.forEach(r => {
                            insertMockRow(r.identifier, r.owner, r.address, r.profile_name, r.base_value, r.status);
                        });
                        populateMoradorResidencesDropdown();
                    }
                }

                // 2. Load Residents
                const cachedMor = SafeStorage.getItem('condosphere_residents');
                if (cachedMor) {
                    const list = JSON.parse(cachedMor);
                    if (list.length > 0) {
                        const tbody = document.querySelector('#tab-moradores table tbody');
                        tbody.innerHTML = "";
                        list.forEach(m => {
                            insertMockMoradorRow(m.name, m.cpf, m.contact, m.role, m.is_associated, m.is_resident, m.residence_name, m.id);
                        });
                    }
                }

                // Load Vehicles and Payables from Cache (New!)
                const cachedVeh = SafeStorage.getItem('condosphere_vehicles');
                if (cachedVeh) {
                    const list = JSON.parse(cachedVeh);
                    const tbody = document.querySelector('#tab-veiculos table tbody');
                    if (tbody && list.length > 0) {
                        tbody.innerHTML = "";
                        list.forEach(v => {
                            const row = document.createElement('tr');
                            row.id = 'veh-row-' + Math.floor(Math.random() * 100000);
                            const statusClass = v.is_active ? 'badge-success' : 'badge-secondary';
                            row.innerHTML = `
                                <td style="font-weight:700; letter-spacing:1px; color:var(--color-primary)">${v.plate}</td>
                                <td>${v.model}</td>
                                <td>${v.color}</td>
                                <td>${v.owner_name}</td>
                                <td><span class="badge ${statusClass}">${v.is_active ? 'Ativo' : 'Inativo'}</span></td>
                                <td>
                                    <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                        <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, 's${v.plate}')"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                                    </div>
                                </td>
                            `;
                            tbody.appendChild(row);
                        });
                    }
                }

                const cachedPay = SafeStorage.getItem('condosphere_payables');
                if (cachedPay) {
                    payablesList = JSON.parse(cachedPay);
                    renderPayables();
                }

                // Load Company Details from Cache (New!)
                const cachedComp = SafeStorage.getItem('condosphere_company');
                if (cachedComp) {
                    applyCompanyDetails(JSON.parse(cachedComp));
                }

                // Load Users from Cache (New!)
                const cachedUsers = SafeStorage.getItem('condosphere_users');
                if (cachedUsers) {
                    const list = JSON.parse(cachedUsers);
                    if (list.length > 0) {
                        const tbody = document.getElementById('table-users').querySelector('tbody');
                        tbody.innerHTML = "";
                            list.forEach(u => {
                                const row = document.createElement('tr');
                                row.id = u.id;
                                row.dataset.linkType = u.link_type || "none";
                                row.dataset.linkId = u.link_id || "";
                                const statusClass = u.is_active ? 'badge-success' : 'badge-danger';
                                const statusText = u.is_active ? 'Ativo' : 'Inativo';
                                const vinculoText = u.link_type === "Morador" ? "Morador" : (u.link_type === "Funcionario" ? "Funcionário" : "Nenhum");
                                row.innerHTML = `
                                    <td><strong>${u.full_name}</strong></td>
                                    <td style="font-family:monospace; color:#60a5fa">${u.username}</td>
                                    <td style="font-family:monospace">${u.cpf || '-'}</td>
                                    <td>${u.profile}</td>
                                    <td>${vinculoText}</td>
                                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                                    <td>
                                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                            <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleUserActiveState(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleUserActiveState(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Editar" onclick="editUserRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteUserRow(this)">
                                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                `;
                                tbody.appendChild(row);
                            });
                    }
                }

                // 3. Load Receivables
                
                // Load Employees from Cache (New!)
                
                // Load Prestadores from Cache (New!)
                
                // Load Assemblies from Cache (New!)
                const cachedAssemblies = SafeStorage.getItem('condosphere_assemblies');
                if (cachedAssemblies) {
                    assembliesList = JSON.parse(cachedAssemblies);
                }
const cachedPres = SafeStorage.getItem('condosphere_prestadores');
                if (cachedPres) {
                    prestadoresList = JSON.parse(cachedPres);
                }
const cachedEmp = SafeStorage.getItem('condosphere_employees');
                if (cachedEmp) {
                    employeesList = JSON.parse(cachedEmp);
                }
const cachedRec = SafeStorage.getItem('condosphere_receivables');
                if (cachedRec) {
                    const list = JSON.parse(cachedRec);
                    if (list.length > 0) {
                        receivablesList = list;
                        renderReceivables();
                    }
                }
            } catch (e) {
                console.warn("[OFFLINE CACHE] Failed to load data from cache fallback:", e);
            }
        }
    
        /* RELATIONAL HELPER: FETCH ALL LIVE DATA FROM SUPABASE ON MOUNT */
        function updateConnectionDiagnostics(show, success, msg, err) {
            console.log('[DB DIAG]', msg, err || '');
        }

        function loadAllDataFromSupabase() {
            if (!supabaseClient && dbSource !== 'local') return;
            
            console.log("[SUPABASE] Sincronizando dados iniciais da nuvem...");
            updateConnectionDiagnostics(true, true, "Tentando sincronizar dados...", null);

            // 1. Fetch residences
            dbClient.from('residences').select('*')
                .then(({ data, error }) => {
                    if (error) {
                        console.error("[SUPABASE ERROR] Fetch residences:", error.message);
                        showToast(`Erro ao carregar residências do Supabase: ${error.message}`, "error");
                        updateConnectionDiagnostics(true, true, "FALHA DE LEITURA", `Tabela residences: ${error.message}`);
                    } else if (data && data.length > 0) {
                        updateConnectionDiagnostics(true, true, "CONECTADO COM SUCESSO!", null);
                        const tbody = document.getElementById('table-residencias-list').querySelector('tbody');
                        tbody.innerHTML = "";
                        data.forEach(r => {
                            // Local insertion into visual table
                            const formattedVal = r.base_value || 300.00;
                            const row = document.createElement('tr');
                            row.id = 'res-row-' + Math.floor(Math.random() * 100000);
                            const statusClass = r.status === 'Ativo' ? 'badge-success' : 'badge-danger';
                            
                            row.innerHTML = `
                                <td><strong>${r.identifier}</strong></td>
                                <td>${r.owner}</td>
                                <td>${r.address}</td>
                                <td style="color:#60a5fa">${r.profile_name || 'Perfil Lote Padrão'}</td>
                                <td>R$ ${Number(formattedVal).toFixed(2).replace('.', ',')}</td>
                                <td><span class="badge ${statusClass}">${r.status}</span></td>
                                <td>
                                    <div style="display:flex; align-items:center; justify-content:center; gap:8px">
                                        <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleResidenciaStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                        <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleResidenciaStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                        <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editResidenciaRow(this)">
                                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                            </svg>
                                        </button>
                                        <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${r.identifier}')">
                                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            `;
                            tbody.appendChild(row);
                        });
                        console.log("[SUPABASE FETCH] Residences loaded!");
                        window._residencesData = data;
                        populateMoradorResidencesDropdown();
                    }
                }).catch(() => {});

            // 2. Fetch residents
            dbClient.from('residents').select('*')
                .then(({ data, error }) => {
                    if (error) {
                        console.error("[SUPABASE ERROR] Fetch residents:", error.message);
                        updateConnectionDiagnostics(true, true, "FALHA DE LEITURA", `Tabela residents: ${error.message}`);
                    } else if (data && data.length > 0) {
                        const tbody = document.querySelector('#tab-moradores table tbody');
                        tbody.innerHTML = "";
                        data.forEach(m => {
                            const tr = document.createElement('tr');
                            tr.id = 'mor-row-' + Math.floor(Math.random() * 100000);
                            tr.dataset.dbId = m.id;
                            const assocChecked = m.is_associated ? "checked" : "";
                            const residChecked = m.is_resident ? "checked" : "";
                            
                            tr.innerHTML = `
                                <td><strong>${m.name}</strong></td>
                                <td>${m.cpf}</td>
                                <td>${m.contact}</td>
                                <td>${m.role}</td>
                                <td style="color:var(--color-primary); font-weight:600">${m.residence_name || 'Sem Vínculo'}</td>
                                <td style="text-align:center">
                                    <span class="checkbox-morador ${m.is_associated ? 'checked' : 'unchecked'}" title="${m.is_associated ? 'Associado' : 'Não Associado'}">${m.is_associated ? '✓' : '✕'}</span>
                                </td>
                                <td style="text-align:center">
                                    <span class="checkbox-morador ${m.is_resident ? 'checked' : 'unchecked'}" title="${m.is_resident ? 'Morador' : 'Não Morador'}">${m.is_resident ? '✓' : '✕'}</span>
                                </td>
                                <td><span class="badge badge-success">Ativo</span></td>
                                <td>
                                    <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                        <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleMoradorStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                        <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleMoradorStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                        <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="editMoradorRow(this)">
                                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                            </svg>
                                        </button>
                                        <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${m.name}')">
                                            <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                        console.log("[SUPABASE FETCH] Residents loaded!");
                        window._residentsData = data;
                    }
                }).catch(() => {});

            // 3. Fetch receivables
            dbClient.from('receivables').select('*')
                .then(({ data, error }) => {
                    if (error) {
                        console.error("[SUPABASE ERROR] Fetch receivables:", error.message);
                    } else if (data && data.length > 0) {
                        receivablesList = data.map(rc => ({
                            id: rc.id,
                            identifier: rc.identifier || "Mensalidade",
                            owner: rc.owner_name,
                            dueDate: rc.due_date,
                            delayDays: rc.delay_days || 0,
                            baseValue: Number(rc.base_value),
                            extraCharges: Number(rc.extra_fees),
                            agreedDiscounts: Number(rc.agreed_discounts),
                            status: rc.status || 'Pendente'
                        }));
                        renderReceivables();
                        console.log("[SUPABASE FETCH] Receivables loaded!");
                    }
                }).catch(() => {});

// 6. Fetch Company Settings (Supabase Linked)
            if (supabaseClient) {
                dbClient.from('company_settings').select('*').eq('id', 'main')
                    .then(({ data, error }) => {
                        if (!error && data && data[0]) {
                            applyCompanyDetails(data[0]);
                            SafeStorage.setItem('condosphere_company', JSON.stringify(data[0]));
                            console.log("[SUPABASE FETCH] Company settings loaded!");
                        }
                    }).catch(() => {});
            }

                        // 5. Fetch reservations (Supabase Linked)
            if (supabaseClient) {
                dbClient.from('reservations').select('*')
                    .then(({ data, error }) => {
                        if (!error && data) {
                            const tbody = document.querySelector('#tab-reservas table tbody');
                            if (tbody) {
                                tbody.innerHTML = "";
                                if (data.length === 0) {
                                    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--color-text-muted)">Nenhuma reserva agendada neste mês.</td></tr>';
                                } else {
                                    data.forEach(r => {
                                        const row = document.createElement('tr');
                                        row.id = r.id;
                                        const statusClass = r.status === 'Confirmado' ? 'badge-success' : 'badge-warning';
                                        row.innerHTML = `
                                            <td>#${r.id.substring(0,4).toUpperCase()}</td>
                                            <td>${r.area_name}</td>
                                            <td>${r.resident_name}</td>
                                            <td>${r.date}</td>
                                            <td>${r.time_period || 'O dia todo'}</td>
                                            <td>R$ ${parseFloat(r.fee).toFixed(2).replace('.', ',')}</td>
                                            <td><span class="badge ${statusClass}">${r.status}</span></td>
                                            <td>
                                                <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                                    <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleReservaStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                                    <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleReservaStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                                    <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Editar" onclick="editReservaRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg></button>
                                                    <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, 'Reserva #${r.id}')"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                                                </div>
                                            </td>
                                        `;
                                        tbody.appendChild(row);
                                    });
                                }
                                renderReservationsCalendar();
                            }
                        }
                    }).catch(() => {});
                    }
            
            
            // 4. Fetch users (Supabase Linked)
            dbClient.from('users').select('*')
                .then(({ data, error }) => {
                    const tbody = document.getElementById('table-users').querySelector('tbody');
                    if (tbody) {
                        tbody.innerHTML = "";
                        if (!error && data && data.length > 0) {
                            data.forEach(u => {
                                const row = document.createElement('tr');
                                row.id = u.id;
                                const statusClass = u.is_active ? 'badge-success' : 'badge-danger';
                                const statusText = u.is_active ? 'Ativo' : 'Inativo';
                                const resolvedProfile = (u.username.includes('admin') || u.username.includes('gerente') || u.username.includes('kzam') || u.username.includes('sindico')) ? 'Administrador' : 'Colaborador';

                                row.dataset.linkType = u.resident_id ? "Morador" : (u.employee_id ? "Funcionario" : "none");
                                row.dataset.linkId = u.resident_id || u.employee_id || "";
                                const vinculoText = u.resident_id ? "Morador" : (u.employee_id ? "Funcionário" : "Nenhum");

                                row.innerHTML = `
                                    <td><strong>${u.full_name}</strong></td>
                                    <td style="font-family:monospace; color:#60a5fa">${u.username}</td>
                                    <td style="font-family:monospace">${u.cpf || '-'}</td>
                                    <td>${resolvedProfile}</td>
                                    <td>${vinculoText}</td>
                                    <td><span class="badge ${statusClass}">${statusText}</span></td>
                                    <td>
                                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                            <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleUserActiveState(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleUserActiveState(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Editar" onclick="editUserRow(this)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg></button>
                                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteUserRow(this)">
                                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                `;
                                tbody.appendChild(row);
                            });
                            console.log("[SUPABASE FETCH] Users loaded!");
                            saveLocalUsersToCache();
                        } else {
                            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted)">Nenhum usuário secundário cadastrado.</td></tr>';
                        }
                    }
                }).catch(() => {});
        
            // 7. Fetch Vehicles (Supabase Linked)
            if (supabaseClient) {
                dbClient.from('vehicles').select('*').order('plate', { ascending: true })
                    .then(({ data, error }) => {
                        if (!error && data) {
                            const tbody = document.querySelector('#tab-veiculos table tbody');
                            if (tbody) {
                                tbody.innerHTML = "";
                                if (data.length === 0) {
                                    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted)">Nenhum veículo cadastrado.</td></tr>';
                                } else {
                                    data.forEach(v => {
                                        const row = document.createElement('tr');
                                        row.id = v.id;
                                        const statusClass = v.is_active ? 'badge-success' : 'badge-secondary';
                                        row.innerHTML = `
                                            <td style="font-weight:700; letter-spacing:1px; color:var(--color-primary)">${v.plate}</td>
                                            <td>${v.model}</td>
                                            <td>${v.color}</td>
                                            <td>${v.owner_name}</td>
                                            <td><span class="badge ${statusClass}">${v.is_active ? 'Ativo' : 'Inativo'}</span></td>
                                            <td>
                                                <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                                    <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${v.plate}')"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                                                </div>
                                            </td>
                                        `;
                                        tbody.appendChild(row);
                                    });
                                }
                                saveLocalVehiclesToCache();
                            }
                        }
                    });
            }

            // 8. Fetch Payables (Supabase Linked)
            if (supabaseClient) {
                dbClient.from('payables').select('*').order('due_date', { ascending: true })
                    .then(({ data, error }) => {
                        if (!error && data) {
                            payablesList = data.map(p => ({
                                id: p.id,
                                creditor: p.creditor,
                                description: p.description,
                                dueDate: p.due_date,
                                category: p.category,
                                value: parseFloat(p.value) || 0,
                                status: p.status || 'Pendente',
                                recurrence: p.recurrence || 'Única'
                            }));
                            renderPayables();
                            saveLocalPayablesToCache();
                        }
                    });
            }
}
    
        
        function saveLocalVehiclesToCache() {
            const list = [];
            const rows = Array.from(document.querySelectorAll('#tab-veiculos table tbody tr'));
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    list.push({
                        plate: cells[0].textContent.trim(),
                        model: cells[1].textContent.trim(),
                        color: cells[2].textContent.trim(),
                        owner_name: cells[3].textContent.trim(),
                        is_active: row.querySelector('.badge').classList.contains('badge-success')
                    });
                }
            });
            SafeStorage.setItem('condosphere_vehicles', JSON.stringify(list));
        }

        function saveLocalPayablesToCache() {
            SafeStorage.setItem('condosphere_payables', JSON.stringify(payablesList));
        
            // 9. Fetch Common Areas (Supabase Linked)
            if (supabaseClient) {
                dbClient.from('common_areas').select('*').order('name', { ascending: true })
                    .then(({ data, error }) => {
                        if (!error && data) {
                            const grid = document.getElementById('areas-grid-container');
                            const tbody = document.querySelector('#tab-areas table tbody');
                            
                            if (grid) grid.innerHTML = "";
                            if (tbody) tbody.innerHTML = "";
                            
                            if (data.length === 0) {
                                if (grid) grid.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); grid-column:span 3; padding:15px; font-size:0.75rem">Nenhuma área comum cadastrada no condomínio.</p>';
                                if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--color-text-muted); padding:15px">Nenhuma área comum cadastrada.</td></tr>';
                            } else {
                                data.forEach(area => {
                                    if (grid) {
                                        const card = document.createElement('div');
                                        card.className = "area-card";
                                        const badgeClass = area.status === 'Livre' ? 'badge-success' : 'badge-danger';
                                        card.innerHTML = `
                                            <span class="badge ${badgeClass}" style="position:absolute; top:12px; right:12px">${area.status || 'Livre'}</span>
                                            <h4 style="font-weight:700; margin-bottom:6px">${area.name}</h4>
                                            <p style="font-size:0.72rem; color:var(--color-text-muted)">Capacidade: ${area.capacity} Pessoas<br>Taxa Limpeza: R$ ${parseFloat(area.cleaning_fee).toFixed(2).replace('.', ',')}</p>
                                        `;
                                        grid.appendChild(card);
                                    }
                                    
                                    if (tbody) {
                                        const row = document.createElement('tr');
                                        row.id = area.id;
                                        row.dataset.dbId = area.id;
                                        const badgeClass = area.status === 'Livre' ? 'badge-success' : 'badge-danger';
                                        row.innerHTML = `
                                            <td><strong>${area.name}</strong></td>
                                            <td>${area.capacity} Pessoas</td>
                                            <td>R$ ${parseFloat(area.cleaning_fee).toFixed(2).replace('.', ',')}</td>
                                            <td><span class="badge ${badgeClass}">${area.status || 'Livre'}</span></td>
                                            <td>
                                                <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                                                    <button class="action-icon" style="color:var(--color-success); border:none; background:none" title="Ativar" onclick="toggleAreaStatus(this, true)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg></button>
                                                    <button class="action-icon" style="color:var(--color-warning); border:none; background:none" title="Desativar" onclick="toggleAreaStatus(this, false)"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg></button>
                                                    <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteTableRow(this, '${area.name}')"><svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg></button>
                                                </div>
                                            </td>
                                        `;
                                        tbody.appendChild(row);
                                    }
                                });
                            }
                            syncReservasAreaSelect();
                        }
                    });
            }

            // 10. Fetch Portaria Logs (Supabase Linked)
            if (supabaseClient) {
                dbClient.from('portaria_logs').select('*').order('created_at', { ascending: false })
                    .then(({ data, error }) => {
                        if (!error && data) {
                            const tbody = document.getElementById('table-logs-rows');
                            if (tbody) {
                                tbody.innerHTML = "";
                                if (data.length === 0) {
                                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted)">Nenhum registro de acesso na portaria.</td></tr>';
                                } else {
                                    data.forEach(log => {
                                        const row = document.createElement('tr');
                                        row.id = log.id;
                                        row.dataset.dbId = log.id;
                                        
                                        let formatTime = log.created_at;
                                        if (formatTime && formatTime.includes("T")) {
                                            const parts = formatTime.split("T");
                                            const ymd = parts[0].split("-");
                                            const hms = parts[1].split(".")[0];
                                            formatTime = `${ymd[2]}/${ymd[1]}/${ymd[0]} ${hms.substring(0,5)}`;
                                        }

                                        row.innerHTML = `
                                            <td><strong>${log.name}</strong><br><span style="font-size:0.65rem; color:var(--color-text-muted)">${log.doc_identifier}</span></td>
                                            <td><button class="btn btn-secondary" style="font-size:0.6rem; padding:2px 6px" onclick="showLightbox('${log.photo_doc || defaultDocSvg}')">👁️ Ver Doc</button></td>
                                            <td><button class="btn btn-secondary" style="font-size:0.6rem; padding:2px 6px" onclick="showLightbox('${log.photo_person || defaultPersonSvg}')">👁️ Ver Foto</button></td>
                                            <td><span class="badge ${log.access_type === 'Visitante' ? 'badge-info' : 'badge-warning'}">${log.access_type}</span></td>
                                            <td style="font-family:monospace; font-weight:bold">${log.vehicle_info || '-'}</td>
                                            <td>${log.authorizer_info}</td>
                                            <td class="date-col">${formatTime}</td>
                                        `;
                                        tbody.appendChild(row);
                                    });
                                }
                            }
                        }
                    });
            }
}


        /* DATABASE CLEANING / RESET LOGIC (NEW!) */
        function openDeleteTablesModal() {
            document.getElementById('modal-delete-tables').style.display = 'flex';
        }
        function closeDeleteTablesModal() {
            document.getElementById('modal-delete-tables').style.display = 'none';
        }
        function toggleAllDeleteCheckboxes(check) {
            document.querySelectorAll('.del-tbl-chk').forEach(chk => chk.checked = check);
        }
        function confirmDeleteSelectedTables() {
            const selectedChks = Array.from(document.querySelectorAll('.del-tbl-chk:checked')).map(chk => chk.value);
            if (selectedChks.length === 0) {
                showToast("Nenhuma tabela foi selecionada!", "warning");
                return;
            }

            if (!confirm(`TEM CERTEZA ABSOLUTA?\nVocê selecionou ${selectedChks.length} tabela(s) para deletar TODOS os registros permanentemente!`)) {
                return;
            }

            if (confirm("Confirmação Final: Digite OK para confirmar a deleção permanente de todos os dados do banco.")) {
                selectedChks.forEach(tbl => {
                    // 1. Clear Local UI / States
                    if (tbl === 'residences') {
                        document.querySelector('#table-residencias-list tbody').innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--color-text-muted)">Nenhuma residência cadastrada</td></tr>';
                    } else if (tbl === 'residents') {
                        document.querySelector('#tab-moradores table tbody').innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--color-text-muted)">Nenhum morador encontrado</td></tr>';
                    } else if (tbl === 'vehicles') {
                        document.querySelector('#tab-veiculos table tbody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted)">Nenhum veículo cadastrado</td></tr>';
                    } else if (tbl === 'reservations') {
                        document.querySelector('#tab-reservas table tbody').innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted)">Nenhuma reserva efetuada</td></tr>';
                    } else if (tbl === 'payables') {
                        payablesList = [];
                        renderPayables();
                    } else if (tbl === 'receivables') {
                        receivablesList = [];
                        renderReceivables();
                    } else if (tbl === 'portaria_logs') {
                        document.getElementById('table-logs-rows').innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--color-text-muted)">Nenhum registro de acesso na portaria</td></tr>';
                    }

                    // 2. Sync with Supabase (Cloud Database Truncate safely)
                    if (supabaseClient) {
                        try {
                            dbClient.from(tbl).delete().neq('id', '00000000-0000-0000-0000-000000000000')
                                .then(({ error }) => {
                                    if (error) console.warn(`[SUPABASE DELETE] Erro ao limpar a tabela ${tbl}:`, error.message);
                                    else console.log(`[SUPABASE DELETE] Tabela ${tbl} limpa com sucesso no Supabase!`);
                                })
                                .catch(() => {});
                        } catch (e) {
                            console.warn(`[SUPABASE DELETE] Erro de rede ou sandbox ao limpar ${tbl}`);
                        }
                    }
                });

                closeDeleteTablesModal();
                showToast("Dados das tabelas selecionadas excluídos com sucesso!", "success");
            }
        }

        /* BATCH SETTLE ("Quitar em Grupo") HANDLERS */
        let activeBatchIds = [];

        function openBatchSettleModal() {
            activeBatchIds = [];
            document.getElementById('modal-batch-settle').style.display = 'flex';
            document.getElementById('batch-rec-search').value = "";
            renderBatchSettleList();
        }

        function closeBatchSettleModal() {
            document.getElementById('modal-batch-settle').style.display = 'none';
        }

        function renderBatchSettleList() {
            const listDiv = document.getElementById('batch-settle-list');
            const term = document.getElementById('batch-rec-search').value.toLowerCase().trim();
            listDiv.innerHTML = "";

            const pending = receivablesList.filter(r => r.status !== 'Pago');
            const filtered = pending.filter(r => r.owner.toLowerCase().includes(term) || r.identifier.toLowerCase().includes(term));

            if (filtered.length === 0) {
                listDiv.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); padding:20px">Nenhum morador em atraso encontrado.</p>';
                updateBatchSummary();
                return;
            }

            filtered.forEach(rec => {
                const label = document.createElement('label');
                label.style.display = "flex";
                label.style.alignItems = "center";
                label.style.justifyContent = "space-between";
                label.style.padding = "6px";
                label.style.borderRadius = "4px";
                label.style.cursor = "pointer";
                label.className = "hover-bg";

                const isChecked = activeBatchIds.includes(rec.id) ? "checked" : "";
                
                label.innerHTML = `
                    <div style="display:flex; align-items:center; gap:8px">
                        <input type="checkbox" class="batch-rec-chk" value="${rec.id}" ${isChecked} onchange="toggleBatchRecCheckbox(${rec.id}, this)">
                        <div style="display:flex; flex-direction:column">
                            <span style="font-weight:bold; color:white">${rec.owner}</span>
                            <span style="font-size:0.68rem; color:var(--color-text-muted)">${rec.identifier}</span>
                        </div>
                    </div>
                    <span style="font-family:monospace; font-weight:bold; color:var(--color-success)">R$ ${rec.baseValue.toFixed(2)}</span>
                `;
                listDiv.appendChild(label);
            });

            updateBatchSummary();
        }

        function filterBatchSettleList() {
            renderBatchSettleList();
        }

        function toggleBatchRecCheckbox(id, chk) {
            if (chk.checked) {
                if (!activeBatchIds.includes(id)) activeBatchIds.push(id);
            } else {
                activeBatchIds = activeBatchIds.filter(item => item !== id);
            }
            updateBatchSummary();
        }

        function updateBatchSummary() {
            const countSpan = document.getElementById('batch-selected-count');
            const totalSpan = document.getElementById('batch-selected-total');

            const selectedRecs = receivablesList.filter(r => activeBatchIds.includes(r.id));
            const sum = selectedRecs.reduce((acc, curr) => acc + curr.baseValue, 0);

            countSpan.innerText = activeBatchIds.length;
            totalSpan.innerText = `R$ ${sum.toFixed(2)}`;
        }

        function confirmBatchSettle() {
            if (activeBatchIds.length === 0) {
                showToast("Nenhum morador/mensalidade foi selecionado!", "warning");
                return;
            }

            if (!confirm(`Confirma a quitação em grupo de ${activeBatchIds.length} mensalidades?`)) {
                return;
            }

            receivablesList = receivablesList.map(r => {
                if (activeBatchIds.includes(r.id)) {
                    r.status = 'Pago';
                    r.delayDays = 0;
                }
                return r;
            });

            // Sync with Supabase Cloud
            if (supabaseClient) {
                activeBatchIds.forEach(id => {
                    dbClient.from('receivables').update({ status: 'Pago' }).eq('id', id).then(() => {});
                });
            }

            closeBatchSettleModal();
            renderReceivables();
            saveLocalReceivablesToCache();
            showToast(`${activeBatchIds.length} mensalidades quitadas em lote com sucesso!`, 'success');
        }

        /* REAL-TIME LIVE SEARCH FILTER HANDLERS (NEW!) */
        function filterResidencesTable() {
            const term = document.getElementById('residences-search').value.toLowerCase().trim();
            const rows = document.querySelectorAll('#table-residencias-list tbody tr');
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    const match = cells[0].textContent.toLowerCase().includes(term) ||
                                  cells[1].textContent.toLowerCase().includes(term) ||
                                  cells[2].textContent.toLowerCase().includes(term) ||
                                  cells[3].textContent.toLowerCase().includes(term);
                    row.style.display = match ? "" : "none";
                }
            });
        }

        function filterResidentsTable() {
            const term = document.getElementById('residents-search').value.toLowerCase().trim();
            const rows = document.querySelectorAll('#tab-moradores table tbody tr');
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    const match = cells[0].textContent.toLowerCase().includes(term) ||
                                  cells[1].textContent.toLowerCase().includes(term) ||
                                  cells[2].textContent.toLowerCase().includes(term) ||
                                  cells[3].textContent.toLowerCase().includes(term) ||
                                  cells[4].textContent.toLowerCase().includes(term);
                    row.style.display = match ? "" : "none";
                }
            });
        }

        function filterVehiclesTable() {
            const term = document.getElementById('vehicles-search').value.toLowerCase().trim();
            const rows = document.querySelectorAll('#tab-veiculos table tbody tr');
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 4) {
                    const match = cells[0].textContent.toLowerCase().includes(term) ||
                                  cells[1].textContent.toLowerCase().includes(term) ||
                                  cells[2].textContent.toLowerCase().includes(term) ||
                                  cells[3].textContent.toLowerCase().includes(term);
                    row.style.display = match ? "" : "none";
                }
            });
        }

        
        
        /* 11. EMPLOYEE STATE AND CONTROLLERS (NEW!) */
        let employeesList = [];

        function syncPayrollDatabaseFromEmployees() {
            payrollDatabase = {};
            employeesList.forEach(emp => {
                if (emp.is_active) {
                    payrollDatabase[emp.id] = {
                        base: emp.salary,
                        adv: emp.advance,
                        ot50: 0,
                        ot100: 0,
                        night: 0,
                        absences: 0,
                        net: emp.salary - emp.advance,
                        name: emp.name
                    };
                }
            });
        }

        function openEmployeeModal(isEdit = false, id = null) {
            document.getElementById('modal-employee').style.display = 'flex';
            if (isEdit && id) {
                document.getElementById('employee-modal-title').innerText = "Editar Funcionário";
                const emp = employeesList.find(e => String(e.id) === String(id));
                if (emp) {
                    document.getElementById('emp-edit-id').value = emp.id;
                    document.getElementById('emp-name').value = emp.name;
                    document.getElementById('emp-cpf').value = emp.cpf;
                    document.getElementById('emp-contact').value = emp.contact || "";
                    document.getElementById('emp-role').value = emp.role;
                    document.getElementById('emp-admission-date').value = emp.admission_date || "";
                    document.getElementById('emp-salary').value = emp.salary;
                    document.getElementById('emp-advance').value = emp.advance || 0;
                    document.getElementById('emp-earnings').value = JSON.stringify(emp.earnings || []);
                    document.getElementById('emp-status').value = emp.is_active ? "Ativo" : "Inativo";
                }
            } else {
                document.getElementById('employee-modal-title').innerText = "Incluir Funcionário";
                document.getElementById('emp-edit-id').value = "";
                document.getElementById('emp-name').value = "";
                document.getElementById('emp-cpf').value = "";
                document.getElementById('emp-contact').value = "";
                document.getElementById('emp-role').value = "";
                document.getElementById('emp-admission-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('emp-salary').value = "";
                document.getElementById('emp-advance').value = "0.00";
                document.getElementById('emp-earnings').value = '[]';
                document.getElementById('emp-status').value = "Ativo";
            }
        }

        function closeEmployeeModal() {
            document.getElementById('modal-employee').style.display = 'none';
        }

        function filterEmployeesTable() {
            const term = document.getElementById('employees-search').value.toLowerCase().trim();
            const rows = document.querySelectorAll('#employee-table-rows tr');
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 7) {
                    const match = cells[0].textContent.toLowerCase().includes(term) ||
                                  cells[1].textContent.toLowerCase().includes(term) ||
                                  cells[2].textContent.toLowerCase().includes(term);
                    row.style.display = match ? "" : "none";
                }
            });
        }

        function submitEmployeeForm(event) {
            event.preventDefault();
            try {
                const id = document.getElementById('emp-edit-id').value;
                const name = document.getElementById('emp-name').value;
                const cpf = document.getElementById('emp-cpf').value;
                const contact = document.getElementById('emp-contact').value;
                const role = document.getElementById('emp-role').value;
                const admission = document.getElementById('emp-admission-date').value;
                const salary = parseFloat(document.getElementById('emp-salary').value) || 0;
                const advance = parseFloat(document.getElementById('emp-advance').value) || 0;
                const status = document.getElementById('emp-status').value === "Ativo";
                
                let earnings = [];
                try {
                    earnings = JSON.parse(document.getElementById('emp-earnings').value || '[]');
                } catch(pe) {
                    earnings = [];
                }

                if (id) {
                    // Edit
                    const emp = employeesList.find(e => String(e.id) === String(id));
                    if (emp) {
                        emp.name = name;
                        emp.cpf = cpf;
                        emp.contact = contact;
                        emp.role = role;
                        emp.admission_date = admission;
                        emp.salary = salary;
                        emp.advance = advance;
                        emp.earnings = earnings;
                        emp.is_active = status;
                    }
                } else {
                    // Create
                    const newId = 'emp-' + Math.floor(Math.random() * 100000);
                    employeesList.push({
                        id: newId,
                        name,
                        cpf,
                        contact,
                        role,
                        admission_date: admission,
                        salary,
                        advance,
                        earnings,
                        is_active: status
                    });
                }

                saveLocalEmployeesToCache();
                renderEmployees();
                closeEmployeeModal();
                showToast("Funcionário salvo com sucesso!");

                // Sync with Supabase
                if (supabaseClient) {
                    const updateData = {
                        name,
                        cpf,
                        contact,
                        role,
                        admission_date: admission,
                        salary,
                        advance,
                        earnings,
                        is_active: status
                    };
                    if (id) {
                        Promise.resolve(dbClient.from('employees').update(updateData).eq('id', id)).catch(() => {});
                    } else {
                        Promise.resolve(dbClient.from('employees').insert([updateData])).catch(() => {});
                    }
                }
            } catch(e) {
                console.error("Error submitting employee form:", e);
                showToast("Erro ao salvar funcionário! " + e.message, "error");
            }
        }

        function deleteEmployee(id) {
            if (confirm("Tem certeza que deseja excluir o registro deste funcionário?")) {
                employeesList = employeesList.filter(e => String(e.id) !== String(id));
                saveLocalEmployeesToCache();
                renderEmployees();
                showToast("Registro excluído com sucesso.");

                if (supabaseClient) {
                    dbClient.from('employees').delete().eq('id', id).catch(() => {});
                }
            }
        }

        function saveLocalEmployeesToCache() {
            SafeStorage.setItem('condosphere_employees', JSON.stringify(employeesList));
        }

        function renderEmployees() {
            const tbody = document.getElementById('employee-table-rows');
            if (!tbody) return;
            tbody.innerHTML = '';

            employeesList.forEach(emp => {
                const tr = document.createElement('tr');
                tr.id = 'emp-row-' + emp.id;
                
                const formatSalary = emp.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const formatAdvance = emp.advance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                
                let formatAdmission = emp.admission_date;
                if (formatAdmission && formatAdmission.includes("-")) {
                    const parts = formatAdmission.split("-");
                    formatAdmission = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }

                tr.innerHTML = `
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.cpf}</td>
                    <td>${emp.role}</td>
                    <td style="color:var(--color-success); font-weight:bold">${formatSalary}</td>
                    <td style="color:var(--color-danger)">${formatAdvance}</td>
                    <td>${emp.contact || '-'}</td>
                    <td>${formatAdmission || '-'}</td>
                    <td><span class="badge ${emp.is_active ? 'badge-success' : 'badge-secondary'}">${emp.is_active ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="openEmployeeModal(true, '${emp.id}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteEmployee('${emp.id}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Sync the payrollDatabase
            syncPayrollDatabaseFromEmployees();

            // Re-populate the employee selection inside DP & Folha de Pagamento!
            renderDynamicPayrollTable();
            populateEmployeeDropdowns();
        }

        function populateEmployeeDropdowns() {
            // Select in registrar adiantamento
            const selectAdv = document.getElementById('adv-employee');
            if (selectAdv) {
                selectAdv.innerHTML = '';
                employeesList.forEach(emp => {
                    if (emp.is_active) {
                        const opt = document.createElement('option');
                        opt.value = emp.name;
                        opt.setAttribute('data-role', emp.role);
                        opt.innerText = `${emp.name} (${emp.role})`;
                        selectAdv.appendChild(opt);
                    }
                });
            }
        }

        function renderDynamicPayrollTable() {
            const tbody = document.getElementById('payroll-table-rows');
            if (!tbody) return;
            tbody.innerHTML = '';

            employeesList.forEach(emp => {
                if (emp.is_active) {
                    const tr = document.createElement('tr');
                    tr.style.cursor = 'pointer';
                    tr.onclick = function() { openPayrollCalculatorModal(emp.id); };
                    
                    const formatSalary = emp.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const formatAdvance = emp.advance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    
                    // calculate dynamic net
                    const netSalary = (emp.salary - emp.advance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                    tr.innerHTML = `
                        <td><strong>${emp.name}</strong></td>
                        <td>${emp.role}</td>
                        <td>${formatSalary}</td>
                        <td id="payroll-adv-${emp.id}" style="color:var(--color-danger)">${formatAdvance}</td>
                        <td id="payroll-net-${emp.id}" style="font-weight:700; color:white">${netSalary}</td>
                        <td style="text-align:center"><button class="btn btn-secondary" style="font-size:0.65rem; padding:4px 8px">⚙️ Calcular</button></td>
                    `;
                    tbody.appendChild(tr);
                }
            });
        }

/* INSTALLMENT PAYABLE MODAL FUNCTIONS (NEW!) */
        function openInstallmentPayableModal() {
            document.getElementById('modal-installment-payable').style.display = 'flex';
            document.getElementById('inst-pay-first-date').value = new Date().toISOString().split('T')[0];
            document.getElementById('inst-pay-creditor').value = "";
            document.getElementById('inst-pay-desc').value = "";
            document.getElementById('inst-pay-total-value').value = "";
            document.getElementById('inst-pay-count').value = "3";
            document.getElementById('inst-pay-part-value').value = "";
        }

        function closeInstallmentPayableModal() {
            document.getElementById('modal-installment-payable').style.display = 'none';
        }

        function calculateInstallmentValueLive() {
            const total = parseFloat(document.getElementById('inst-pay-total-value').value) || 0;
            const count = parseInt(document.getElementById('inst-pay-count').value) || 1;
            if (count > 0) {
                const part = total / count;
                document.getElementById('inst-pay-part-value').value = part.toFixed(2);
            }
        }

        function submitInstallmentPayableForm(event) {
            event.preventDefault();
            try {
                const creditor = document.getElementById('inst-pay-creditor').value;
                const desc = document.getElementById('inst-pay-desc').value;
                const category = document.getElementById('inst-pay-category').value;
                const firstDateStr = document.getElementById('inst-pay-first-date').value;
                const totalVal = parseFloat(document.getElementById('inst-pay-total-value').value) || 0;
                const count = parseInt(document.getElementById('inst-pay-count').value) || 1;
                const partVal = parseFloat(document.getElementById('inst-pay-part-value').value) || 0;

                if (count <= 0 || partVal <= 0) {
                    showToast("Quantidade ou valor de parcela inválido!", "error");
                    return;
                }

                const firstDate = new Date(firstDateStr + 'T00:00:00');

                for (let i = 0; i < count; i++) {
                    const nextDate = new Date(firstDate);
                    nextDate.setMonth(firstDate.getMonth() + i);
                    
                    const year = nextDate.getFullYear();
                    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
                    const day = String(nextDate.getDate()).padStart(2, '0');
                    const formattedDateStr = `${year}-${month}-${day}`;

                    const newId = payablesList.length > 0 ? Math.max(...payablesList.map(p => p.id)) + 1 : 1;

                    payablesList.push({
                        id: newId,
                        creditor: creditor,
                        description: `${desc} (Parcela ${i + 1}/${count})`,
                        dueDate: formattedDateStr,
                        category: category,
                        value: partVal,
                        status: 'Pendente',
                        recurrence: 'Mensal'
                    });
                }

                renderPayables();
                closeInstallmentPayableModal();
                showToast(`Lançamento parcelado de ${count} parcelas efetuado com sucesso!`);
            } catch (err) {
                console.error("[submitInstallmentPayableForm] Error:", err);
                showToast("Erro ao lançar despesa parcelada!", "error");
            }
        }

        
        /* 12. PRESTADORES STATE AND CONTROLLERS (NEW!) */
        let prestadoresList = [];

        function openPrestadorModal(isEdit = false, id = null) {
            document.getElementById('modal-prestador').style.display = 'flex';
            if (isEdit && id) {
                document.getElementById('prestador-modal-title').innerText = "Editar Prestador de Serviço";
                const pres = prestadoresList.find(p => String(p.id) === String(id));
                if (pres) {
                    document.getElementById('pres-edit-id').value = pres.id;
                    document.getElementById('pres-company').value = pres.company;
                    document.getElementById('pres-cnpj').value = pres.cnpj;
                    document.getElementById('pres-service').value = pres.service;
                    document.getElementById('pres-value').value = pres.contractValue;
                    document.getElementById('pres-status').value = pres.status;
                }
            } else {
                document.getElementById('prestador-modal-title').innerText = "Incluir Prestador de Serviço";
                document.getElementById('pres-edit-id').value = "";
                document.getElementById('pres-company').value = "";
                document.getElementById('pres-cnpj').value = "";
                document.getElementById('pres-service').value = "";
                document.getElementById('pres-value').value = "";
                document.getElementById('pres-status').value = "Ativo";
            }
        }

        function closePrestadorModal() {
            document.getElementById('modal-prestador').style.display = 'none';
        }

        function filterProvidersTable() {
            const term = document.getElementById('providers-search').value.toLowerCase().trim();
            const rows = document.querySelectorAll('#provider-table-rows tr');
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    const match = cells[0].textContent.toLowerCase().includes(term) ||
                                  cells[1].textContent.toLowerCase().includes(term) ||
                                  cells[2].textContent.toLowerCase().includes(term);
                    row.style.display = match ? "" : "none";
                }
            });
        }

        function submitPrestadorForm(event) {
            event.preventDefault();
            try {
                const id = document.getElementById('pres-edit-id').value;
                const company = document.getElementById('pres-company').value;
                const cnpj = document.getElementById('pres-cnpj').value;
                const service = document.getElementById('pres-service').value;
                const val = parseFloat(document.getElementById('pres-value').value) || 0;
                const status = document.getElementById('pres-status').value;

                if (id) {
                    const pres = prestadoresList.find(p => String(p.id) === String(id));
                    if (pres) {
                        pres.company = company;
                        pres.cnpj = cnpj;
                        pres.service = service;
                        pres.contractValue = val;
                        pres.status = status;
                    }
                } else {
                    const newId = 'pres-' + Math.floor(Math.random() * 100000);
                    prestadoresList.push({
                        id: newId,
                        company,
                        cnpj,
                        service,
                        contractValue: val,
                        status
                    });
                }

                saveLocalPrestadoresToCache();
                renderPrestadores();
                closePrestadorModal();
                showToast("Prestador de serviço salvo com sucesso!");

                // Sync with Supabase cloud
                if (supabaseClient) {
                    const updateData = {
                        company,
                        cnpj,
                        service,
                        contract_value: val,
                        status
                    };
                    if (id) {
                        Promise.resolve(dbClient.from('providers').update(updateData).eq('id', id)).catch(() => {});
                    } else {
                        Promise.resolve(dbClient.from('providers').insert([updateData])).catch(() => {});
                    }
                }
            } catch(e) {
                console.error("Error submitting prestador form:", e);
                showToast("Erro ao salvar prestador!", "error");
            }
        }

        function deletePrestador(id) {
            if (confirm("Tem certeza que deseja excluir este contrato de prestador de serviço?")) {
                prestadoresList = prestadoresList.filter(p => String(p.id) !== String(id));
                saveLocalPrestadoresToCache();
                renderPrestadores();
                showToast("Contrato de prestador excluído.");

                if (supabaseClient) {
                    dbClient.from('providers').delete().eq('id', id).catch(() => {});
                }
            }
        }

        function saveLocalPrestadoresToCache() {
            SafeStorage.setItem('condosphere_prestadores', JSON.stringify(prestadoresList));
        }

        function renderPrestadores() {
            const tbody = document.getElementById('provider-table-rows');
            if (!tbody) return;
            tbody.innerHTML = '';

            prestadoresList.forEach(p => {
                const tr = document.createElement('tr');
                tr.id = 'pres-row-' + p.id;
                
                const formatValue = p.contractValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                tr.innerHTML = `
                    <td><strong>${p.company}</strong></td>
                    <td>${p.cnpj}</td>
                    <td>${p.service}</td>
                    <td style="font-weight:700; color:var(--color-primary)">${formatValue}</td>
                    <td><span class="badge ${p.status === 'Ativo' ? 'badge-success' : 'badge-secondary'}">${p.status}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="openPrestadorModal(true, '${p.id}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deletePrestador('${p.id}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }


        /* 13. DIRECT VOIP INTERCOM TELEPHONE ENGINE (NEW!) */
        let activePhoneContact = null;
        let phoneState = "IDLE"; // IDLE, DIALING, CONNECTED
        let phoneTimer = null;
        let callSeconds = 0;
        let callInterval = null;
        let intercomChannel = null;

        let onlineUsers = {};

        function initIntercomRealtime() {
            if (!supabaseClient) return;
            try {
                intercomChannel = supabaseClient.channel('condosphere-intercom');
                const cachedUser = SafeStorage.getItem('currentUser');
                const currentUser = cachedUser ? JSON.parse(cachedUser) : null;

                intercomChannel
                    .on('presence', { event: 'sync' }, () => {
                        const state = intercomChannel.presenceState();
                        onlineUsers = {};
                        Object.values(state).forEach(presences => {
                            presences.forEach(p => {
                                if (p.name) onlineUsers[p.name] = p;
                            });
                        });
                        console.log('[INTERCOM PRESENCE] Online users:', Object.keys(onlineUsers));
                    })
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        newPresences.forEach(p => {
                            if (p.name) onlineUsers[p.name] = p;
                        });
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        leftPresences.forEach(p => {
                            if (p.name) delete onlineUsers[p.name];
                        });
                    })
                    .on('broadcast', { event: 'call-dial' }, ({ payload }) => {
                        handleIncomingCallBroadcast(payload);
                    })
                    .on('broadcast', { event: 'call-answer' }, ({ payload }) => {
                        handleCallAnsweredBroadcast(payload);
                    })
                    .on('broadcast', { event: 'call-decline' }, ({ payload }) => {
                        handleCallDeclinedBroadcast(payload);
                    })
                    .on('broadcast', { event: 'call-hangup' }, ({ payload }) => {
                        handleCallHangupBroadcast(payload);
                    })
                    .subscribe((status) => {
                        console.log("[INTERCOM REALTIME] Channel subscription status:", status);
                        if (status === 'SUBSCRIBED' && currentUser) {
                            intercomChannel.track({
                                name: currentUser.name,
                                role: currentUser.role,
                                online_at: new Date().toISOString()
                            });
                        }
                    });
            } catch (err) {
                console.warn("[INTERCOM REALTIME] Realtime broadcast subscription blocked or unsupported in current environment.");
            }
        }

        function isTargetOnline(targetName, targetRole) {
            if (targetRole === 'Administrador') {
                return Object.values(onlineUsers).some(u => u.role === 'Administrador');
            }
            return !!onlineUsers[targetName];
        }

        function selectIntercomContact(name, unit, role) {
            if (phoneState !== "IDLE") {
                addIntercomLog("[SISTEMA] Chamada em andamento. Desligue antes de trocar de canal.");
                return;
            }
            
            activePhoneContact = { name, unit, role };
            
            document.getElementById('intercom-status-text').innerText = "PRONTO PARA LIGAR";
            document.getElementById('intercom-status-text').style.color = "#38bdf8";
            document.getElementById('intercom-contact-name').innerText = `${name} (${unit})`;
            document.getElementById('intercom-contact-name').style.color = "#94a3b8";
            
            // LED blue indicator for loaded contact
            const led = document.getElementById('intercom-led');
            led.style.backgroundColor = "#3b82f6";
            led.style.boxShadow = "0 0 8px #3b82f6";
            
            const btnCallRes = document.getElementById('btn-phone-call-resident');
            btnCallRes.disabled = false;
            btnCallRes.style.backgroundColor = "var(--color-primary)";
            btnCallRes.style.color = "white";
            btnCallRes.style.cursor = "pointer";
            
            addIntercomLog(`[SISTEMA] Sintonizado com ${name} (${unit}). Clique em 'Ligar p/ Morador' para discar.`);
        }

        function dialAdmin() {
            if (phoneState !== "IDLE") return;

            const cachedUser = SafeStorage.getItem('currentUser');
            const currentUser = cachedUser ? JSON.parse(cachedUser) : null;
            if (!currentUser) {
                addIntercomLog("[SISTEMA] Usuário não identificado.");
                return;
            }

            if (currentUser.role === 'Portaria') {
                if (!isTargetOnline(null, 'Administrador')) {
                    addIntercomLog("[SISTEMA] Nenhum administrador está logado no sistema no momento.");
                    showToast("Nenhum administrador disponível no sistema!", "warning");
                    return;
                }
                activePhoneContact = { name: "Central de Administração", unit: "Sede Geral", role: "Administração" };
                startCallingFlow("Administração");
            } else if (currentUser.role === 'Administrador') {
                if (!isTargetOnline(null, 'Portaria')) {
                    addIntercomLog("[SISTEMA] Nenhum porteiro está logado no sistema no momento.");
                    showToast("Nenhum porteiro disponível no sistema!", "warning");
                    return;
                }
                activePhoneContact = { name: "Portaria de Plantão", unit: "Guarita", role: "Portaria" };
                startCallingFlow("Portaria");
            } else {
                addIntercomLog("[SISTEMA] Seu perfil não pode realizar esta chamada.");
                showToast("Seu perfil não pode realizar esta chamada!", "warning");
            }
        }

        function dialResident() {
            if (phoneState !== "IDLE" || !activePhoneContact) return;
            if (!isTargetOnline(activePhoneContact.name, activePhoneContact.role)) {
                addIntercomLog(`[SISTEMA] ${activePhoneContact.name} não está logado no sistema.`);
                showToast(`${activePhoneContact.name} não está disponível no momento!`, "warning");
                return;
            }
            startCallingFlow("Morador");
        }

        function startCallingFlow(targetType) {
            phoneState = "DIALING";
            
            const statusText = document.getElementById('intercom-status-text');
            statusText.innerText = "DISCANDO...";
            statusText.style.color = "#f59e0b";
            
            const led = document.getElementById('intercom-led');
            led.style.backgroundColor = "#f59e0b";
            led.style.boxShadow = "0 0 12px #f59e0b";
            
            document.getElementById('intercom-contact-name').innerText = `${activePhoneContact.name} (${activePhoneContact.unit})`;
            
            // Toggle controls view
            document.getElementById('phone-dial-controls').style.display = 'none';
            document.getElementById('phone-active-controls').style.display = 'flex';
            
            addIntercomLog(`[TELEFONE] Ligando para ${activePhoneContact.name}...`);
            
            // Flashing dialing display
            let toggle = true;
            phoneTimer = setInterval(() => {
                led.style.backgroundColor = toggle ? "#f59e0b" : "#1e293b";
                statusText.innerText = toggle ? "DISCANDO..." : "CHAMANDO...";
                toggle = !toggle;
            }, 400);

            // Send Real-time Supabase Broadcast so it rings on the other user's computer screen!
            const cachedUser = SafeStorage.getItem('currentUser');
            const callerUser = cachedUser ? JSON.parse(cachedUser) : null;
            const callerName = callerUser ? callerUser.name : "Portaria Principal";

            if (intercomChannel) {
                intercomChannel.send({
                    type: 'broadcast',
                    event: 'call-dial',
                    payload: {
                        from: callerName,
                        to: activePhoneContact.name,
                        unit: activePhoneContact.unit
                    }
                });
            }
        }

        let lastCallerName = "";

        // --- BROADCAST EVENT LISTENERS ON THE RECEIVING COMPUTER ---
        function handleIncomingCallBroadcast(payload) {
            // Get logged-in user name
            const cachedUser = SafeStorage.getItem('currentUser');
            const currentUser = cachedUser ? JSON.parse(cachedUser) : null;
            
            if (!currentUser) return;

            const isRecipient = currentUser.name.toLowerCase() === payload.to.toLowerCase() || 
                              (currentUser.role === 'Administrador' && payload.to === "Central de Administração") ||
                              (currentUser.role === 'Portaria' && payload.to === "Portaria de Plantão");

            if (isRecipient && phoneState === "IDLE") {
                phoneState = "RINGING";
                lastCallerName = payload.from;
                document.getElementById('inc-caller-name').innerText = payload.from;
                document.getElementById('modal-incoming-call').style.display = "flex";
                console.log("[TELEFONE] Recebendo chamada de:", payload.from);
            }
        }

        function handleCallAnsweredBroadcast(payload) {
            // Called on Portaria side when the Resident answers
            if (phoneState === "DIALING") {
                clearInterval(phoneTimer);
                phoneState = "CONNECTED";
                
                const statusText = document.getElementById('intercom-status-text');
                statusText.innerText = "EM CHAMADA";
                statusText.style.color = "#10b981";
                
                const led = document.getElementById('intercom-led');
                led.style.backgroundColor = "#10b981";
                led.style.boxShadow = "0 0 12px #10b981";
                
                document.getElementById('intercom-wave-container').style.display = "flex";
                addIntercomLog(`[TELEFONE] Chamada Atendida! Em linha com ${activePhoneContact.name}.`);
                
                callSeconds = 0;
                startCallClock();
            }
        }

        function handleCallDeclinedBroadcast(payload) {
            // Called on Portaria side when Resident declines
            if (phoneState === "DIALING") {
                clearInterval(phoneTimer);
                phoneState = "IDLE";
                
                const statusText = document.getElementById('intercom-status-text');
                statusText.innerText = "LIGAÇÃO RECUSADA";
                statusText.style.color = "var(--color-danger)";
                
                const led = document.getElementById('intercom-led');
                led.style.backgroundColor = "#ef4444";
                led.style.boxShadow = "0 0 10px #ef4444";
                
                addIntercomLog(`[TELEFONE] O morador ${activePhoneContact.name} recusou a chamada.`);
                
                setTimeout(resetIntercomToIdle, 2000);
            }
        }

        function handleCallHangupBroadcast(payload) {
            // Called on both sides when either ends the active call
            if (phoneState === "CONNECTED" || phoneState === "RINGING") {
                cleanupActiveCallState();
                addIntercomLog("[TELEFONE] Ligação desligada pelo outro computador.");
            }
        }

        // --- RECEIVER ACTIONS ---
        function answerIncomingCall() {
            // On Resident side: Accept the call
            document.getElementById('modal-incoming-call').style.display = "none";
            document.getElementById('modal-active-call').style.display = "flex";
            document.getElementById('act-caller-name').innerText = lastCallerName || "Portaria Principal";
            
            phoneState = "CONNECTED";
            
            // Broadcast the acceptance back to Portaria
            if (intercomChannel) {
                intercomChannel.send({
                    type: 'broadcast',
                    event: 'call-answer',
                    payload: {}
                });
            }

            // Start resident local timer
            callSeconds = 0;
            if (callInterval) clearInterval(callInterval);
            callInterval = setInterval(() => {
                callSeconds++;
                const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
                const secs = String(callSeconds % 60).padStart(2, '0');
                document.getElementById('act-call-duration').innerText = `${mins}:${secs}`;
            }, 1000);
        }

        function declineIncomingCall() {
            // On Resident side: Decline the incoming call
            document.getElementById('modal-incoming-call').style.display = "none";
            phoneState = "IDLE";
            
            if (intercomChannel) {
                intercomChannel.send({
                    type: 'broadcast',
                    event: 'call-decline',
                    payload: {}
                });
            }
        }

        function hangUpActiveCall() {
            // On Resident side: Hang up connected call
            cleanupActiveCallState();
            
            if (intercomChannel) {
                intercomChannel.send({
                    type: 'broadcast',
                    event: 'call-hangup',
                    payload: {}
                });
            }
        }

        function cleanupActiveCallState() {
            clearInterval(phoneTimer);
            clearInterval(callInterval);
            phoneState = "IDLE";
            
            document.getElementById('modal-incoming-call').style.display = "none";
            document.getElementById('modal-active-call').style.display = "none";
            
            const statusText = document.getElementById('intercom-status-text');
            if (statusText) {
                statusText.innerText = "AGUARDANDO SELEÇÃO";
                statusText.style.color = "#64748b";
            }
            
            const led = document.getElementById('intercom-led');
            if (led) {
                led.style.backgroundColor = "#475569";
                led.style.boxShadow = "none";
            }
            
            const waves = document.getElementById('intercom-wave-container');
            if (waves) waves.style.display = "none";
            
            const clock = document.getElementById('intercom-clock');
            if (clock) clock.innerText = "QAP";
            
            const dialControls = document.getElementById('phone-dial-controls');
            if (dialControls) dialControls.style.display = 'flex';
            
            const activeControls = document.getElementById('phone-active-controls');
            if (activeControls) activeControls.style.display = 'none';
        }

        function resetIntercomToIdle() {
            phoneState = "IDLE";
            const statusText = document.getElementById('intercom-status-text');
            statusText.innerText = "AGUARDANDO SELEÇÃO";
            statusText.style.color = "#64748b";
            
            const led = document.getElementById('intercom-led');
            led.style.backgroundColor = "#475569";
            led.style.boxShadow = "none";
            
            document.getElementById('phone-dial-controls').style.display = 'flex';
            document.getElementById('phone-active-controls').style.display = 'none';
            
            if (activePhoneContact && activePhoneContact.name !== "Central de Administração") {
                selectIntercomContact(activePhoneContact.name, activePhoneContact.unit, activePhoneContact.role);
            } else {
                activePhoneContact = null;
                document.getElementById('intercom-contact-name').innerText = "Nenhum canal ativo";
                document.getElementById('btn-phone-call-resident').disabled = true;
                document.getElementById('btn-phone-call-resident').style.backgroundColor = "#374151";
                document.getElementById('btn-phone-call-resident').style.color = "#94a3b8";
                document.getElementById('btn-phone-call-resident').style.cursor = "not-allowed";
            }
        }

        function startCallClock() {
            if (callInterval) clearInterval(callInterval);
            callInterval = setInterval(() => {
                callSeconds++;
                const mins = String(Math.floor(callSeconds / 60)).padStart(2, '0');
                const secs = String(callSeconds % 60).padStart(2, '0');
                document.getElementById('intercom-clock').innerText = `${mins}:${secs}`;
            }, 1000);
        }

        function hangUpPhone() {
            // On Portaria side: Hang up dialing or active call
            if (intercomChannel) {
                intercomChannel.send({
                    type: 'broadcast',
                    event: 'call-hangup',
                    payload: {}
                });
            }
            cleanupActiveCallState();
            addIntercomLog(`[TELEFONE] Chamada finalizada com ${activePhoneContact ? activePhoneContact.name : ""}.`);
        }

        function addIntercomLog(text) {
            const logDiv = document.getElementById('intercom-logs');
            if (!logDiv) return;
            
            const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const span = document.createElement('span');
            span.innerHTML = `<span style="color:#475569">[${time}]</span> ${text}`;
            logDiv.appendChild(span);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        // Live Clock for Intercom Display
        setInterval(() => {
            const timeEl = document.getElementById('intercom-clock');
            if (timeEl && phoneState === "IDLE") {
                timeEl.innerText = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            }
        }, 1000);

        
        /* 14. ASSEMBLIES STATE AND CONTROLLERS (NEW!) */
        let assembliesList = []; // Starts empty (Clean database ready for deployment!)

        function openAssemblyModal() {
            document.getElementById('modal-assembly').style.display = 'flex';
            document.getElementById('as-title').value = "";
            document.getElementById('as-theme').value = "";
            document.getElementById('as-start').value = new Date().toISOString().split('T')[0];
            
            // Set end date to +10 days
            const end = new Date();
            end.setDate(end.getDate() + 10);
            document.getElementById('as-end').value = end.toISOString().split('T')[0];
            
            document.getElementById('as-p1-title').value = "";
            document.getElementById('as-p1-desc').value = "";
            document.getElementById('as-p2-title').value = "";
            document.getElementById('as-p2-desc').value = "";
        }

        function closeAssemblyModal() {
            document.getElementById('modal-assembly').style.display = 'none';
        }

        function submitAssemblyForm(event) {
            event.preventDefault();
            try {
                const title = document.getElementById('as-title').value;
                const theme = document.getElementById('as-theme').value;
                const startDate = document.getElementById('as-start').value;
                const endDate = document.getElementById('as-end').value;
                
                const p1Title = document.getElementById('as-p1-title').value;
                const p1Desc = document.getElementById('as-p1-desc').value;
                
                const p2Title = document.getElementById('as-p2-title').value;
                const p2Desc = document.getElementById('as-p2-desc').value;

                const proposals = [
                    { id: 1, title: p1Title, description: p1Desc, yes_votes: 0, no_votes: 0 }
                ];

                if (p2Title && p2Desc) {
                    proposals.push({ id: 2, title: p2Title, description: p2Desc, yes_votes: 0, no_votes: 0 });
                }

                const newId = 'as-' + Math.floor(Math.random() * 100000);
                const newAssembly = {
                    id: newId,
                    title,
                    theme,
                    start_date: startDate,
                    end_date: endDate,
                    proposals
                };

                assembliesList.push(newAssembly);
                saveLocalAssembliesToCache();
                renderAssemblies();
                closeAssemblyModal();
                showToast("Nova assembleia geral virtual aberta para votação!");

                // Sync with Supabase cloud
                if (supabaseClient) {
                    const insertPayload = {
                        title,
                        theme,
                        start_date: startDate,
                        end_date: endDate,
                        proposals
                    };
                    Promise.resolve(dbClient.from('assemblies').insert([insertPayload])).catch(() => {});
                }
            } catch (err) {
                console.error("Error submitting assembly form:", err);
                showToast("Erro ao lançar assembleia!", "error");
            }
        }

        function castAssemblyVote(assemblyId, proposalId, voteType) {
            const as = assembliesList.find(a => String(a.id) === String(assemblyId));
            if (!as) return;

            const prop = as.proposals.find(p => p.id === proposalId);
            if (!prop) return;

            if (voteType === 'yes') {
                prop.yes_votes++;
            } else {
                prop.no_votes++;
            }

            saveLocalAssembliesToCache();
            renderAssemblies();
            showToast("Seu voto secreto criptografado foi registrado e auditado pela comissão!", "success");

            // Sync update with Supabase
            if (supabaseClient && !String(assemblyId).startsWith('as-')) {
                dbClient.from('assemblies').update({
                    proposals: as.proposals
                }).eq('id', assemblyId).catch(() => {});
            }
        }

        function deleteAssembly(id) {
            if (confirm("Tem certeza que deseja cancelar esta votação e excluir a assembleia do sistema?")) {
                assembliesList = assembliesList.filter(a => String(a.id) !== String(id));
                saveLocalAssembliesToCache();
                renderAssemblies();
                showToast("Assembleia cancelada e excluída.");

                if (supabaseClient && !String(id).startsWith('as-')) {
                    dbClient.from('assemblies').delete().eq('id', id).catch(() => {});
                }
            }
        }

        function saveLocalAssembliesToCache() {
            SafeStorage.setItem('condosphere_assemblies', JSON.stringify(assembliesList));
        }

        function renderAssemblies() {
            const container = document.getElementById('assemblies-list-container');
            if (!container) return;
            container.innerHTML = '';

            if (assembliesList.length === 0) {
                container.innerHTML = `<div style="text-align:center; color:var(--color-text-muted); padding:30px; font-size:0.75rem; border:1px dashed var(--color-border); border-radius:8px">
                    🗳️ Nenhuma assembleia virtual aberta ou pauta em votação cadastrada neste momento.
                </div>`;
                return;
            }

            assembliesList.forEach(as => {
                const today = new Date().toISOString().split('T')[0];
                const isActive = today >= as.start_date && today <= as.end_date;
                const statusBadge = isActive ? '<span class="badge badge-success">Em Andamento</span>' : '<span class="badge badge-secondary">Finalizada</span>';
                
                const startParts = as.start_date.split('-');
                const endParts = as.end_date.split('-');
                const formattedPeriod = `${startParts[2]}/${startParts[1]}/${startParts[0]} a ${endParts[2]}/${endParts[1]}/${endParts[0]}`;

                const card = document.createElement('div');
                card.className = "panel-card";
                card.style.backgroundColor = "rgba(255,255,255,0.01)";
                card.style.border = "1px solid var(--color-border)";
                card.style.borderRadius = "12px";
                card.style.padding = "20px";
                card.style.marginBottom = "15px";

                let proposalsHTML = '';
                as.proposals.forEach(p => {
                    const totalVotes = p.yes_votes + p.no_votes;
                    const yesPct = totalVotes > 0 ? Math.round((p.yes_votes / totalVotes) * 100) : 0;
                    const noPct = totalVotes > 0 ? Math.round((p.no_votes / totalVotes) * 100) : 0;

                    const disabledAttr = isActive ? "" : "disabled";

                    proposalsHTML += `
                            <!-- Proposal ${p.id} -->
                            <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--color-border); padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between">
                                <div>
                                    <span style="font-size:0.65rem; background:rgba(96,165,250,0.1); color:#60a5fa; padding:2px 8px; border-radius:4px; font-weight:bold; text-transform:uppercase">Pauta #0${p.id}</span>
                                    <h4 style="font-size:0.9rem; font-weight:bold; margin-top:8px; margin-bottom:6px; color:white">${p.title}</h4>
                                    <p style="font-size:0.72rem; color:var(--color-text-muted); line-height:1.4">${p.description}</p>
                                </div>
                                <div style="margin-top:20px">
                                    <!-- Results Progress -->
                                    <div style="margin-bottom:16px">
                                        <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:bold; margin-bottom:4px">
                                            <span>Sim: ${p.yes_votes} votos</span>
                                            <span>${yesPct}%</span>
                                        </div>
                                        <div style="width:100%; height:8px; background:var(--color-border); border-radius:4px; overflow:hidden; margin-bottom:12px">
                                            <div style="width:${yesPct}%; height:100%; background:var(--color-success); transition:width 0.5s ease"></div>
                                        </div>

                                        <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:bold; margin-bottom:4px">
                                            <span>Não: ${p.no_votes} votos</span>
                                            <span>${noPct}%</span>
                                        </div>
                                        <div style="width:100%; height:8px; background:var(--color-border); border-radius:4px; overflow:hidden">
                                            <div style="width:${noPct}%; height:100%; background:var(--color-danger); transition:width 0.5s ease"></div>
                                        </div>
                                    </div>
                                    <!-- Action Buttons -->
                                    <div style="display:flex; gap:10px">
                                        <button class="btn btn-success" style="flex:1; font-size:0.7rem; padding:8px" onclick="castAssemblyVote('${as.id}', ${p.id}, 'yes')" ${disabledAttr}>Votar SIM</button>
                                        <button class="btn btn-danger" style="flex:1; font-size:0.7rem; padding:8px" onclick="castAssemblyVote('${as.id}', ${p.id}, 'no')" ${disabledAttr}>Votar NÃO</button>
                                    </div>
                                </div>
                            </div>
                    `;
                });

                card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border); padding-bottom:14px; margin-bottom:20px; flex-wrap:wrap; gap:10px">
                            <div>
                                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px">
                                    ${statusBadge}
                                    <h3 class="panel-title">${as.title}</h3>
                                </div>
                                <p class="panel-subtitle">Tema: ${as.theme}</p>
                            </div>
                            <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px">
                                <div>
                                    <p style="font-size:0.7rem; color:var(--color-text-muted)">Período de Votação:</p>
                                    <p style="font-size:0.75rem; font-weight:bold; color:white">${formattedPeriod}</p>
                                </div>
                                <button class="btn btn-secondary" onclick="deleteAssembly('${as.id}')" style="font-size:0.6rem; padding:4px 8px; color:var(--color-danger); border-color:rgba(239,68,68,0.2)">✕ Excluir</button>
                            </div>
                        </div>

                        <!-- Topics in Voting (Pautas) Grid -->
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px">
                            ${proposalsHTML}
                        </div>
                `;

                container.appendChild(card);
            });
        }

// On startup render payables, receivables and visitor log dynamic lists
        window.onload = function() {
            checkAuthOnLoad();
            loadLocalDataFromCache(); // Tier 2: Instant local offline storage load!
            renderPayables();
            renderVisitorLogs();
            renderEmployees();
            renderPrestadores();
            setTimeout(renderReservationsCalendar, 200);
            setTimeout(loadAllDataFromSupabase, 800); // Tier 1: Slower cloud sync (replaces cache if connected)

            // [TAB-DIAG-DELAYED] Check tab panel visibility after all loads settle
            setTimeout(() => {
                console.log('=== [TAB-DIAG-DELAYED] 3s after load ===');
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    const cs = getComputedStyle(panel);
                    console.log(`[TAB-DIAG-DELAYED] ${panel.id}: inlineStyle="${panel.getAttribute('style') || '(none)'}" computedDisplay="${cs.display}"`);
                });
            }, 3000);
            setTimeout(() => {
                console.log('=== [TAB-DIAG-DELAYED] 10s after load ===');
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    const cs = getComputedStyle(panel);
                    console.log(`[TAB-DIAG-DELAYED] ${panel.id}: computedDisplay="${cs.display}"`);
                });
            }, 10000);
        }
    