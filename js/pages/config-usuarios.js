
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

        const userDatabase = {
            "admin.geral": { role: "Administrador", name: "Maurício Albuquerque", job: "Gestor Master & Arquiteto", avatar: "MA", pass: "12345678901" },
            "reginaldo.silveira": { role: "Colaborador", name: "Reginaldo Silveira", job: "Zelador Geral", avatar: "RS", pass: "22233344455" },
            "carlos.silva": { role: "Morador", name: "Carlos Henrique Silva", job: "Morador Proprietário", avatar: "CS", pass: "33344455566" },
            "jose.portaria": { role: "Portaria", name: "José Portaria", job: "Supervisor Portaria", avatar: "JP", pass: "44455566677" }
        };
