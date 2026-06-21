
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
