
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


        /* EXCEL EXPORT WORKFLOWS FOR ACTIVE MODULES (Aprovado!) */
        function downloadResidenciasExcelModel() {
            const headers = ["Identificador", "Proprietário Principal", "Endereço Completo", "Perfil Financeiro", "Valor Faturado", "Status"];
            const rows = [
                ["Quadra A - Lote 05", "Carlos Henrique Silva", "Av. das Palmeiras, 102", "Perfil Lote Padrão", 300.00, "Ativo"],
                ["Quadra A - Lote 12", "Mariana Souza Oliveira", "Av. das Palmeiras, 220", "Perfil Lote Luxo", 500.00, "Ativo"],
                ["Quadra D - Lote 01", "Associação Comercial", "Av. Principal, 500", "Perfil Comercial", 750.00, "Ativo"]
            ];
            downloadGenuineExcel("modelo_residencias_condosphere.xlsx", "Residencias", headers, rows);
        }
