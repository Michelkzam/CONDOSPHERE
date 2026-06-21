
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

        let prestadoresList = [];
