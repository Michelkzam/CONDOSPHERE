
        /* AUTOMATIC SYNC OF RECEIVABLES FROM RESIDENCES & RESIDENTS */
        function syncReceivablesWithResidencesAndResidents() {
            // 1. Scan Residences
            const resRows = Array.from(document.querySelectorAll('#table-residencias-list tbody tr'));
            resRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    const identifier = cells[0].textContent.trim();
                    const owner = cells[1].textContent.trim();
                    if (!owner || owner === "Sem Proprietário" || owner === "Nenhum") return;
                    
                    const resValText = cells[4].textContent.replace('R$', '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.').trim();
                    const baseValue = parseFloat(resValText) || 300.00;
                    
                    // Check if this residence-owner combination is already in receivablesList
                    const exists = receivablesList.some(r => r.identifier === identifier && r.owner === owner);
                    if (!exists) {
                        const newId = Math.floor(Math.random() * 90000) + 10000;
                        const todayStr = new Date().toISOString().split('T')[0];
                        receivablesList.push({
                            id: newId,
                            identifier: identifier,
                            owner: owner,
                            dueDate: todayStr,
                            delayDays: 0,
                            baseValue: baseValue,
                            extraCharges: 0.00,
                            status: "Pendente"
                        });
                    }
                }
            });


        }


        function openAnticipateModal(id) {
            selectedAnticipateRecId = id;
            const rec = receivablesList.find(r => r.id === id);
            if (!rec) return;

            document.getElementById('ant-owner-name').innerText = rec.owner;
            document.getElementById('ant-months-select').value = "3";
            document.getElementById('modal-anticipate').style.display = 'flex';
            calculateAnticipationValues();
        }


        function closeAnticipateModal() {
            document.getElementById('modal-anticipate').style.display = 'none';
        }


        function calculateAnticipationValues() {
            const rec = receivablesList.find(r => r.id === selectedAnticipateRecId);
            if (!rec) return;

            const months = parseInt(document.getElementById('ant-months-select').value);
            const baseValue = rec.baseValue;

            let discountPercent = 0;
            if (months >= 12) discountPercent = 15;
            else if (months >= 6) discountPercent = 10;
            else if (months >= 3) discountPercent = 5;

            const totalWithoutDiscount = baseValue * months;
            const discountVal = (totalWithoutDiscount * discountPercent) / 100;
            const finalToPay = totalWithoutDiscount - discountVal;

            document.getElementById('ant-unit-val').innerText = `R$ ${baseValue.toFixed(2)}`;
            document.getElementById('ant-subtotal-val').innerText = `R$ ${totalWithoutDiscount.toFixed(2)}`;
            document.getElementById('ant-discount-val').innerText = `- R$ ${discountVal.toFixed(2)} (${discountPercent}%)`;
            document.getElementById('ant-final-val').innerText = `R$ ${finalToPay.toFixed(2)}`;
        }


        function confirmAnticipation() {
            const rec = receivablesList.find(r => r.id === selectedAnticipateRecId);
            if (!rec) return;

            const months = parseInt(document.getElementById('ant-months-select').value);
            const baseValue = rec.baseValue;

            let discountPercent = 0;
            if (months >= 12) discountPercent = 15;
            else if (months >= 6) discountPercent = 10;
            else if (months >= 3) discountPercent = 5;

            const discountPerMonth = (baseValue * discountPercent) / 100;

            const [y, m, d] = rec.dueDate.split('-').map(Number);
            let baseDate = new Date(y, m - 1, d);

            for (let i = 1; i <= months; i++) {
                const futureDate = new Date(baseDate);
                futureDate.setMonth(baseDate.getMonth() + i);
                
                // Format date precisely as YYYY-MM-DD
                const yyyy = futureDate.getFullYear();
                const mm = String(futureDate.getMonth() + 1).padStart(2, '0');
                const dd = String(futureDate.getDate()).padStart(2, '0');
                const futureDateStr = `${yyyy}-${mm}-${dd}`;

                receivablesList.push({
                    id: Math.floor(Math.random() * 900000) + 100000,
                    identifier: rec.identifier,
                    owner: rec.owner,
                    dueDate: futureDateStr,
                    delayDays: 0,
                    baseValue: baseValue,
                    extraCharges: 0.00,
                    agreedDiscounts: discountPerMonth,
                    status: "Pago" // Pre-paid instantly
                });
            }

            closeAnticipateModal();
            renderReceivables();
            saveLocalReceivablesToCache();
            
            showToast(`Antecipação de ${months} parcelas mensais efetuada para ${rec.owner}! Desconto aplicado!`, 'success');
        }


        /* EDIT AND CANCEL RECEIVABLE ACTIONS (Aprovado!) */
        function editReceivable(id) {
            try {
                console.log("[editReceivable] called with id:", id, typeof id);
                const rec = receivablesList.find(r => String(r.id).trim() === String(id).trim() || r.id == id);
                if (!rec) {
                    console.error("[editReceivable] Could not find receivable in list for id:", id);
                    showToast("Erro: Cobrança não encontrada para edição!", "error");
                    return;
                }

                document.getElementById('edit-rec-id').value = rec.id;
                document.getElementById('edit-rec-identifier').value = rec.identifier || "";
                document.getElementById('edit-rec-owner').value = rec.owner || "";
                
                let dateVal = rec.dueDate || "";
                if (dateVal.includes("T")) {
                    dateVal = dateVal.split("T")[0];
                }
                if (dateVal.includes("/")) {
                    const parts = dateVal.split("/");
                    if (parts[2] && parts[2].length === 4) {
                        dateVal = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                }
                document.getElementById('edit-rec-due-date').value = dateVal;
                
                document.getElementById('edit-rec-base-value').value = rec.baseValue || 0;
                document.getElementById('edit-rec-extra-charges').value = rec.extraCharges || 0;
                document.getElementById('edit-rec-discounts').value = rec.agreedDiscounts || 0;
                document.getElementById('edit-rec-status').value = rec.status || "Pendente";

                document.getElementById('modal-edit-receivable').style.display = 'flex';
            } catch (err) {
                console.error("[editReceivable] Error:", err);
                showToast("Erro ao abrir formulário de edição!", "error");
            }
        }


        function closeEditReceivableModal() {
            document.getElementById('modal-edit-receivable').style.display = 'none';
        }


        function submitEditReceivableForm(event) {
            event.preventDefault();
            try {
                const id = document.getElementById('edit-rec-id').value;
                const rec = receivablesList.find(r => String(r.id).trim() === String(id).trim() || r.id == id);
                if (!rec) {
                    showToast("Erro ao salvar alterações da cobrança!", "error");
                    return;
                }

                rec.identifier = document.getElementById('edit-rec-identifier').value;
                rec.owner = document.getElementById('edit-rec-owner').value;
                rec.dueDate = document.getElementById('edit-rec-due-date').value;
                rec.baseValue = parseFloat(document.getElementById('edit-rec-base-value').value) || 0;
                rec.extraCharges = parseFloat(document.getElementById('edit-rec-extra-charges').value) || 0;
                rec.agreedDiscounts = parseFloat(document.getElementById('edit-rec-discounts').value) || 0;
                rec.status = document.getElementById('edit-rec-status').value;

                // Recalculate delayDays based on today's date if status is not Pago
                if (rec.status === 'Vencido' || rec.status === 'Pendente') {
                    const today = new Date();
                    const due = new Date(rec.dueDate);
                    const diffTime = today - due;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    rec.delayDays = diffDays > 0 ? diffDays : 0;
                    if (diffDays > 0 && rec.status !== 'Pago') {
                        rec.status = 'Vencido';
                    }
                } else if (rec.status === 'Pago') {
                    rec.delayDays = 0;
                }

                renderReceivables();
                saveLocalReceivablesToCache();

                // Sync with Supabase if client exists
                if (supabaseClient) {
                    dbClient.from('receivables').update({
                        identifier: rec.identifier,
                        owner_name: rec.owner,
                        due_date: rec.dueDate,
                        base_value: rec.baseValue,
                        extra_fees: rec.extraCharges,
                        agreed_discounts: rec.agreedDiscounts,
                        status: rec.status,
                        delay_days: rec.delayDays
                    }).eq('id', id).then(() => {
                        showToast("Cobrança sincronizada com o Supabase!");
                    }).catch(err => {
                        console.error("Erro ao sincronizar com Supabase:", err);
                    });
                }

                closeEditReceivableModal();
                showToast("Cobrança atualizada com sucesso!");
            } catch (err) {
                console.error("[submitEditReceivableForm] Error:", err);
                showToast("Erro ao salvar cobrança!", "error");
            }
        }


        function openCancelModal(id) {
            try {
                console.log("[openCancelModal] called with id:", id);
                const rec = receivablesList.find(r => String(r.id).trim() === String(id).trim() || r.id == id);
                if (!rec) {
                    showToast("Cobrança não encontrada!", "error");
                    return;
                }

                document.getElementById('cancel-rec-id').value = rec.id;
                document.getElementById('cancel-owner-name').innerText = rec.owner;
                document.getElementById('cancel-unit-ident').innerText = rec.identifier;
                
                const penalty = rec.status === 'Vencido' ? rec.baseValue * 0.02 : 0;
                const interest = rec.status === 'Vencido' ? rec.baseValue * (0.01 * (rec.delayDays / 30)) : 0;
                const discount = rec.agreedDiscounts || 0;
                const totalDue = rec.baseValue + rec.extraCharges + penalty + interest - discount;
                
                document.getElementById('cancel-total-val').innerText = `R$ ${totalDue.toFixed(2)}`;
                document.getElementById('cancel-rec-justification').value = "";

                // Dynamic title change based on status
                const titleEl = document.querySelector('#modal-cancel-receivable .modal-title');
                if (titleEl) {
                    if (rec.status === 'Pago') {
                        titleEl.innerHTML = "↩️ Cancelar Pagamento";
                    } else {
                        titleEl.innerHTML = "🚫 Cancelar Cobrança";
                    }
                }

                document.getElementById('modal-cancel-receivable').style.display = 'flex';
            } catch (err) {
                console.error("[openCancelModal] Error:", err);
            }
        }


        function closeCancelReceivableModal() {
            document.getElementById('modal-cancel-receivable').style.display = 'none';
        }


        // Stub functions for new action buttons
        function openPartialPaymentModal(id) {
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;
            showToast(`💡 Pagamento parcial de R$ ${(rec.baseValue / 2).toFixed(2)} registrado para ${rec.owner}!`);
        }


        function openBoletoPixModal(id) {
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;
            showToast(`🏦 Boleto/PIX gerado para ${rec.owner} - Código: 34191.57801 00001.234567 89012.345678 9 87650000${String(rec.id).padStart(10,'0')}`);
        }


        function openWriteOffModal(id) {
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;
            if (confirm(`Tem certeza que deseja baixar como perda a cobrança de ${rec.owner} (R$ ${rec.baseValue.toFixed(2)})?`)) {
                rec.status = 'Pago';
                rec.isWriteOff = true;
                renderReceivables();
                saveLocalReceivablesToCache();
                showToast(`🚫 Cobrança de ${rec.owner} baixada como perda!`);
            }
        }


        function submitCancelReceivableForm(event) {
            event.preventDefault();
            try {
                const id = document.getElementById('cancel-rec-id').value;
                const justification = document.getElementById('cancel-rec-justification').value;

                const rec = receivablesList.find(r => String(r.id).trim() === String(id).trim() || r.id == id);
                if (!rec) {
                    showToast("Erro: Cobrança não localizada!", "error");
                    return;
                }

                const wasPaid = rec.status === 'Pago';
                rec.status = 'Cancelado';
                rec.cancellation_justification = justification;
                rec.justification = justification;

                renderReceivables();
                saveLocalReceivablesToCache();

                // Sync with Supabase if client exists
                if (supabaseClient) {
                    dbClient.from('receivables').update({
                        status: 'Cancelado',
                        cancellation_justification: justification
                    }).eq('id', id).then(() => {
                        showToast("Sincronizado com o Supabase!");
                    }).catch(err => {
                        console.error("Erro ao cancelar no Supabase:", err);
                    });
                }

                closeCancelReceivableModal();
                showToast(wasPaid ? "Pagamento cancelado com sucesso!" : "Cobrança cancelada com sucesso!");
            } catch (err) {
                console.error("[submitCancelReceivableForm] Error:", err);
                showToast("Erro ao processar cancelamento!", "error");
            }
        }

    
        function renderReceivables() {
            syncReceivablesWithResidencesAndResidents();
            const term = document.getElementById('receivable-search') ? document.getElementById('receivable-search').value.toLowerCase().trim() : "";

            // Detect which sub-tab is active
            const isAcordosTab = document.getElementById('sub-recebiveis-rec-moradores-acordos')?.classList.contains('active');
            const tbodyId = isAcordosTab ? 'table-recebiveis-acordos-rows' : 'receivable-rows';
            const tbody = document.getElementById(tbodyId);
            if (!tbody) return;
            tbody.innerHTML = '';

            let totalReceived = 0;
            let totalPending = 0;

            receivablesList.forEach(rec => {
                // Filter by sub-tab: Inadimplencia shows Pendente/Vencido; Acordos shows only Acordo
                if (isAcordosTab && rec.status !== 'Acordo') return;
                if (!isAcordosTab && rec.status === 'Acordo') return;

                // Search filter
                const matches = rec.identifier.toLowerCase().includes(term) ||
                                rec.owner.toLowerCase().includes(term);
                if (!matches) return;

                const penalty = rec.status === 'Vencido' ? rec.baseValue * 0.02 : 0;
                const interest = rec.status === 'Vencido' ? rec.baseValue * (0.01 * (rec.delayDays / 30)) : 0;
                const discount = rec.agreedDiscounts || 0;
                const totalDue = rec.baseValue + rec.extraCharges + penalty + interest - discount;

                if (rec.status === 'Pago') totalReceived += (rec.baseValue + rec.extraCharges - discount);
                else totalPending += totalDue;

                const row = document.createElement('tr');
                row.dataset.id = rec.id;
                if (rec.status === 'Vencido') {
                    row.style.backgroundColor = "rgba(239, 68, 68, 0.04)";
                } else if (rec.status === 'Acordo') {
                    row.style.backgroundColor = "rgba(59, 130, 216, 0.06)";
                }

                let formattedDate = rec.dueDate || "";
                if (formattedDate.includes("T")) {
                    formattedDate = formattedDate.split("T")[0];
                }
                if (formattedDate.includes("-")) {
                    const dateParts = formattedDate.split('-');
                    formattedDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                }

                // Check if resident has multiple unpaid installments (Inadimplente Recorrente)
                const unpaidCount = receivablesList.filter(r => r.owner === rec.owner && r.status === 'Vencido').length;
                const warningBadge = (rec.status === 'Vencido' && unpaidCount > 1) ? `
                    <span class="badge badge-danger" style="font-size:0.6rem; padding:1px 4px; display:inline-block; margin-top:2px; font-weight:bold; animation: pulse 2s infinite">
                        ⚠️ Inadimplente Recorrente (${unpaidCount} parcelas em atraso)
                    </span>
                ` : '';

                const discountDetail = (rec.agreedDiscounts && rec.agreedDiscounts > 0) ? `
                    <span style="font-size:0.65rem; color:var(--color-success); display:block">
                        (- R$ ${rec.agreedDiscounts.toFixed(2)})
                    </span>
                ` : '';

                row.innerHTML = `
                    <td><strong>${rec.identifier}</strong></td>
                    <td>
                        <div style="display:flex; flex-direction:column">
                            <strong>${rec.owner}</strong>
                            ${warningBadge}
                        </div>
                    </td>
                    <td class="date-col">${formattedDate}</td>
                    <td style="color:${rec.delayDays > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)'}; font-weight:700">${rec.delayDays > 0 ? rec.delayDays + ' dias' : '-'}</td>
                    <td>
                        R$ ${rec.baseValue.toFixed(2)}
                        ${discountDetail}
                    </td>
                    <td style="color:var(--color-warning)">R$ ${(penalty + interest).toFixed(2)}</td>
                    <td style="font-weight:700; color:white">R$ ${totalDue.toFixed(2)}</td>
                    <td><span class="badge ${rec.status === 'Pago' ? 'badge-success' : (rec.status === 'Acordo' ? 'badge-info' : (rec.status === 'Cancelado' ? 'badge-secondary' : (rec.status === 'Pendente' ? 'badge-warning' : 'badge-danger')))}">${rec.status}</span></td>
                    <td style="text-align:center">
                        <button class="action-icon" style="color:var(--color-info); border:none; background:none; font-size:1.1rem; cursor:pointer" title="Abrir Ações" onclick="openActionsPopup(event, '${rec.id}')">📋</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            // Update cash flow metric widgets (only for inadimplencia tab)
            if (!isAcordosTab) {
                document.getElementById('receivable-paid-val').innerText = `R$ ${totalReceived.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                document.getElementById('receivable-pending-val').innerText = `R$ ${totalPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
            }
        }


        // Print Receivable preview
        function printReceivable(id) {
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;
            const penalty = rec.status === 'Vencido' ? rec.baseValue * 0.02 : 0;
            const interest = rec.status === 'Vencido' ? rec.baseValue * (0.01 * (rec.delayDays / 30)) : 0;
            const total = rec.baseValue + rec.extraCharges + penalty + interest - (rec.agreedDiscounts || 0);
            const dt = new Date().toLocaleDateString('pt-BR');
            const w = window.open('', '_blank');
            if (!w) return alert('Permita pop-ups para imprimir.');
            w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cobrança - ${rec.identifier}</title><style>
                *{margin:0;padding:0;box-sizing:border-box}
                body{font-family:'Courier New',monospace;font-size:12px;color:#000;padding:40px}
                .header{text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:25px}
                .header h1{font-size:20px;letter-spacing:2px}
                .header h2{font-size:14px;color:#333;margin-top:5px}
                table{width:100%;border-collapse:collapse;margin:15px 0}
                td{padding:6px 10px;vertical-align:top}
                td.label{font-weight:bold;width:180px;white-space:nowrap}
                .total{font-size:15px;font-weight:bold;text-align:right;margin-top:20px;padding:10px;border-top:2px solid #000}
                .footer{text-align:center;color:#888;font-size:10px;margin-top:35px;padding-top:10px;border-top:1px solid #ccc}
                @media print{body{padding:20px}}
            </style></head><body>
                <div class="header"><h1>CondoSphere ERP</h1><h2>📄 DOCUMENTO DE COBRANÇA</h2><p style="font-size:11px;color:#666;margin-top:3px">Emitido em ${dt}</p></div>
                <table>
                    <tr><td class="label">Morador:</td><td>${rec.owner}</td></tr>
                    <tr><td class="label">Unidade:</td><td>${rec.identifier}</td></tr>
                    <tr><td class="label">Vencimento:</td><td>${new Date(rec.dueDate).toLocaleDateString('pt-BR')}</td></tr>
                    <tr><td class="label">Status:</td><td>${rec.status}</td></tr>
                    ${rec.referenceMonth ? `<tr><td class="label">Referência:</td><td>${rec.referenceMonth}</td></tr>` : ''}
                    <tr><td colspan="2" style="border-top:1px dashed #ccc"></td></tr>
                    <tr><td class="label">Valor Base:</td><td>R$ ${rec.baseValue.toFixed(2)}</td></tr>
                    ${rec.extraCharges ? `<tr><td class="label">Acréscimos:</td><td>R$ ${rec.extraCharges.toFixed(2)}</td></tr>` : ''}
                    ${rec.agreedDiscounts ? `<tr><td class="label">Descontos:</td><td>- R$ ${rec.agreedDiscounts.toFixed(2)}</td></tr>` : ''}
                    <tr><td class="label">Multa (2%):</td><td>R$ ${penalty.toFixed(2)}</td></tr>
                    <tr><td class="label">Juros (1% a.m.):</td><td>R$ ${interest.toFixed(2)}</td></tr>
                </table>
                <div class="total">VALOR TOTAL: R$ ${total.toFixed(2)}</div>
                ${rec.status === 'Pago' || rec.status === 'Acordo' ? `<div style="margin-top:20px;padding:10px;border:2px solid #2e7d32;text-align:center"><span style="font-size:16px;font-weight:bold;color:#2e7d32">✅ RECEBIDO</span></div>` : ''}
                <div class="footer"><p>Documento gerado eletronicamente em ${dt} pelo CondoSphere ERP</p></div>
            </body></html>`);
            w.document.close();
            w.focus();
            setTimeout(() => w.print(), 500);
        }


        // Download Receivable PDF
        function downloadReceivablePDF(id) {
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;
            const penalty = rec.status === 'Vencido' ? rec.baseValue * 0.02 : 0;
            const interest = rec.status === 'Vencido' ? rec.baseValue * (0.01 * (rec.delayDays / 30)) : 0;
            const total = rec.baseValue + rec.extraCharges + penalty + interest - (rec.agreedDiscounts || 0);
            const dt = new Date().toLocaleDateString('pt-BR');
            const w = window.open('', '_blank');
            if (!w) return alert('Permita pop-ups para baixar o PDF.');
            w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Cobranca</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:12px;color:#000;padding:40px}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:15px;margin-bottom:25px}.header h1{font-size:20px}.total{font-size:15px;font-weight:bold;text-align:right;margin-top:20px;padding:10px;border-top:2px solid #000}</style></head><body><div class="header"><h1>CondoSphere ERP</h1><h2>DOCUMENTO DE COBRANCA</h2><p>Emitido em ' + dt + '</p></div><table style="width:100%;border-collapse:collapse"><tr><td style="font-weight:bold;width:180px">Morador:</td><td>' + rec.owner + '</td></tr><tr><td style="font-weight:bold">Unidade:</td><td>' + rec.identifier + '</td></tr><tr><td style="font-weight:bold">Vencimento:</td><td>' + new Date(rec.dueDate).toLocaleDateString('pt-BR') + '</td></tr><tr><td style="font-weight:bold">Status:</td><td>' + rec.status + '</td></tr><tr><td colspan="2" style="border-top:1px dashed #ccc"></td></tr><tr><td style="font-weight:bold">Valor Base:</td><td>R$ ' + rec.baseValue.toFixed(2) + '</td></tr><tr><td style="font-weight:bold">Multa (2%):</td><td>R$ ' + penalty.toFixed(2) + '</td></tr><tr><td style="font-weight:bold">Juros (1% a.m.):</td><td>R$ ' + interest.toFixed(2) + '</td></tr></table><div class="total">VALOR TOTAL: R$ ' + total.toFixed(2) + '</div></body></html>');
            w.document.close();
            setTimeout(function() { w.print(); }, 500);
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


        function openActionsPopup(event, id) {
            event.stopPropagation();
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;

            const popup = document.getElementById('receivable-actions-popup');
            const content = document.getElementById('receivable-actions-content');
            
            // Build action buttons based on status
            let actions = [];

            // Common actions for all statuses
            actions.push({ icon: '🖨️', label: 'Imprimir', color: 'var(--color-text-muted)', fn: `printReceivable('${id}')` });
            actions.push({ icon: '⬇️', label: 'Baixar PDF', color: 'var(--color-text-muted)', fn: `downloadReceivablePDF('${id}')` });

            if (rec.status === 'Pendente' || rec.status === 'Vencido') {
                actions.push({ icon: '💰', label: 'Quitar', color: 'var(--color-success)', fn: `settleReceivable('${id}')` });
                actions.push({ icon: '🔹', label: 'Pag. Parcial', color: 'var(--color-info)', fn: `openPartialPaymentModal('${id}')` });
                actions.push({ icon: '🤝', label: 'Negociar', color: 'var(--color-warning)', fn: `openNegotiationModal('${id}')` });
                actions.push({ icon: '🏦', label: 'Boleto/PIX', color: '#a78bfa', fn: `openBoletoPixModal('${id}')` });
                actions.push({ icon: '📅', label: 'Antecipar', color: 'var(--color-info)', fn: `openAnticipateModal('${id}')` });
                actions.push({ icon: '🚫', label: 'Baixar Perda', color: 'var(--color-danger)', fn: `openWriteOffModal('${id}')` });
            } else if (rec.status === 'Acordo') {
                actions.push({ icon: '💰', label: 'Quitar Acordo', color: 'var(--color-success)', fn: `settleReceivable('${id}')` });
                actions.push({ icon: '🔹', label: 'Pag. Parcial', color: 'var(--color-info)', fn: `openPartialPaymentModal('${id}')` });
                actions.push({ icon: '🏦', label: 'Boleto/PIX', color: '#a78bfa', fn: `openBoletoPixModal('${id}')` });
                actions.push({ icon: '↩️', label: 'Cancelar', color: 'var(--color-danger)', fn: `openCancelModal('${id}')` });
            } else if (rec.status === 'Pago') {
                actions.push({ icon: '🔄', label: 'Estornar', color: '#f43f5e', fn: `openCancelModal('${id}')` });
            }

            // Non-status-specific actions
            if (rec.status !== 'Cancelado') {
                actions.push({ icon: '✏️', label: 'Editar', color: 'var(--color-primary)', fn: `editReceivable('${id}')` });
                actions.push({ icon: '❌', label: 'Excluir', color: 'var(--color-danger)', fn: `deleteReceivableRow('${id}')` });
            }

            content.innerHTML = actions.map(a => `
                <button onclick="${a.fn}; closeActionsPopup()" style="display:flex; align-items:center; gap:6px; padding:7px 8px; border:none; background:transparent; color:${a.color}; cursor:pointer; border-radius:6px; font-size:0.75rem; transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">
                    <span style="font-size:1rem">${a.icon}</span>
                    <span>${a.label}</span>
                </button>
            `).join('');

            // Position popup
            const btn = event.currentTarget;
            const rect = btn.getBoundingClientRect();
            const popW = 220;
            let left = rect.right + 4;
            let top = rect.top;

            // Avoid going off-screen
            if (left + popW > window.innerWidth) {
                left = rect.left - popW - 4;
            }
            if (top + 300 > window.innerHeight) {
                top = window.innerHeight - 310;
            }
            if (top < 4) top = 4;

            popup.style.left = left + 'px';
            popup.style.top = top + 'px';
            popup.style.display = 'block';
        }


        function closeActionsPopup() {
            document.getElementById('receivable-actions-popup').style.display = 'none';
        }


        function deleteReceivableRow(id) {
            const rec = receivablesList.find(r => r.id == id);
            if (!rec) return;
            if (!confirm(`Tem certeza que deseja excluir o registro de "${rec.owner}"?`)) return;
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    row.remove();
                    receivablesList = receivablesList.filter(r => r.id != id);
                    saveLocalReceivablesToCache();
                    if (supabaseClient) {
                        try { dbClient.from('receivables').delete().eq('id', id).then(() => {}); } catch(e) {}
                    }
                    showToast('Registro excluído com sucesso!');
                }, 300);
            } else {
                receivablesList = receivablesList.filter(r => r.id != id);
                renderReceivables();
                saveLocalReceivablesToCache();
                showToast('Registro excluído com sucesso!');
            }
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


        function saveLocalReceivablesToCache() {
            SafeStorage.setItem('condosphere_receivables', JSON.stringify(receivablesList));
        }

        let selectedAnticipateRecId = null;

        let selectedNegRecId = null;

        let activeBatchIds = [];
