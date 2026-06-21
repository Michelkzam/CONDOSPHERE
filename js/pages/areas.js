
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


        function exportAreasExcel() {
            const headers = ["Área Comum", "Capacidade", "Taxa Limpeza", "Status"];
            const rows = [
                ["Salão de Festas Principal", 150, 150.00, "Disponível"],
                ["Churrasqueira A", 30, 50.00, "Ocupado"],
                ["Quadra Poliesportiva", 20, 0.00, "Disponível"]
            ];
            downloadGenuineExcel("areas_comuns_condominio.xlsx", "Areas Comuns", headers, rows);
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
