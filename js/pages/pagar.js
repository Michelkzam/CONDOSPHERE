
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
