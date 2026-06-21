
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


        function exportVeiculosExcel() {
            const headers = ["Placa", "Veículo", "Cor", "Proprietário"];
            const rows = [
                ["ABC-1D23", "Toyota Corolla", "Prata", "Carlos Henrique Silva"],
                ["XYZ-9F87", "Honda Civic", "Preto", "Mariana Souza Oliveira"]
            ];
            downloadGenuineExcel("frota_veiculos_completo.xlsx", "Frota Veiculos", headers, rows);
        }


        function downloadVeiculosExcelModel() {
            const headers = ["Placa", "Veículo", "Cor", "Proprietário"];
            const rows = [
                ["ABC-1D23", "Toyota Corolla", "Prata", "Carlos Henrique"],
                ["XYZ-9F87", "Honda Civic", "Preto", "Mariana Souza"]
            ];
            downloadGenuineExcel("modelo_veiculos_condosphere.xlsx", "Modelo Veiculos", headers, rows);
        }
