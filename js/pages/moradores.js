
        /* DYNAMIC RENDER OF VISITOR ACCESS LOGS TABLE LIST (Makes row click active!) */
        // Load moradores from Supabase when page is loaded dynamically
        function loadMoradoresFromSupabase() {
            if (!supabaseClient && dbSource !== 'supabase') return;
            
            const tbody = document.querySelector('#dynamic-content-area table tbody') || document.querySelector('#tab-moradores table tbody');
            if (!tbody) return;
            
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-text-muted);padding:20px">Carregando moradores...</td></tr>';
            
            dbClient.from('residents').select('*')
                .then(({ data, error }) => {
                    if (error) {
                        console.error("[SUPABASE ERROR] Fetch residents:", error.message);
                        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-danger);padding:20px">Erro ao carregar: ' + error.message + '</td></tr>';
                    } else if (data && data.length > 0) {
                        tbody.innerHTML = "";
                        data.forEach(m => {
                            const tr = document.createElement('tr');
                            tr.id = 'mor-row-' + Math.floor(Math.random() * 100000);
                            tr.dataset.dbId = m.id;
                            
                            tr.innerHTML = `
                                <td><strong>${m.name}</strong></td>
                                <td>${m.cpf}</td>
                                <td>${m.contact}</td>
                                <td>${m.role}</td>
                                <td style="color:var(--color-primary);font-weight:600">${m.residence_name || 'Sem Vínculo'}</td>
                                <td style="text-align:center">
                                    <span class="checkbox-morador ${m.is_associated ? 'checked' : 'unchecked'}" title="${m.is_associated ? 'Associado' : 'Não Associado'}">${m.is_associated ? '✓' : '✕'}</span>
                                </td>
                                <td style="text-align:center">
                                    <span class="checkbox-morador ${m.is_resident ? 'checked' : 'unchecked'}" title="${m.is_resident ? 'Morador' : 'Não Morador'}">${m.is_resident ? '✓' : '✕'}</span>
                                </td>
                                <td><span class="badge badge-success">Ativo</span></td>
                                <td>
                                    <div style="display:flex;align-items:center;justify-content:center;gap:6px">
                                        <button class="action-icon" style="color:var(--color-success);border:none;background:none" title="Ativar" onclick="toggleMoradorStatus(this,true)">
                                            <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                        </button>
                                        <button class="action-icon" style="color:var(--color-warning);border:none;background:none" title="Desativar" onclick="toggleMoradorStatus(this,false)">
                                            <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg>
                                        </button>
                                        <button class="action-icon" style="color:var(--color-primary);border:none;background:none" title="Alterar" onclick="editMoradorRow(this)">
                                            <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/></svg>
                                        </button>
                                        <button class="action-icon" style="color:var(--color-danger);border:none;background:none" title="Excluir" onclick="deleteTableRow(this,'${m.name}')">
                                            <svg style="width:16px;height:16px;fill:currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/></svg>
                                        </button>
                                    </div>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                        console.log("[MORADORES] " + data.length + " registros carregados do Supabase");
                    } else {
                        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-text-muted);padding:20px">Nenhum morador cadastrado</td></tr>';
                    }
                }).catch(err => {
                    console.error("[MORADORES] Erro:", err);
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-danger);padding:20px">Falha na conexão</td></tr>';
                });
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


        function downloadMoradoresExcelModel() {
            const headers = ["Nome", "CPF", "Contato", "Função", "Residência Vinculada", "Associado", "Morador"];
            const rows = [
                ["Carlos Henrique Silva", "123.456.789-01", "(11) 98765-4321", "Proprietário", "Quadra A - Lote 05", "Sim", "Sim"],
                ["Mariana Souza Oliveira", "987.654.321-02", "(11) 97654-3210", "Proprietário", "Quadra A - Lote 12", "Sim", "Sim"],
                ["Roberto de Alencar", "456.789.123-03", "(11) 96543-2109", "Inquilino", "Quadra B - Lote 02", "Não", "Sim"]
            ];
            downloadGenuineExcel("modelo_moradores_condosphere.xlsx", "Moradores", headers, rows);
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
