
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


        /* DYNAMIC PROFILE OPERATIONS (Ativar/Desativar, Editar, Copiar, Excluir) */
        function toggleProfileActiveState(checkbox, name) {
            if (checkbox.checked) {
                showToast(`Perfil "${name}" ativado com sucesso!`, 'success');
            } else {
                showToast(`Perfil "${name}" desativado!`, 'warning');
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
