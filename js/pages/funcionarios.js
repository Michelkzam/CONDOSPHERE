
        function syncPayrollDatabaseFromEmployees() {
            payrollDatabase = {};
            employeesList.forEach(emp => {
                if (emp.is_active) {
                    payrollDatabase[emp.id] = {
                        base: emp.salary,
                        adv: emp.advance,
                        ot50: 0,
                        ot100: 0,
                        night: 0,
                        absences: 0,
                        net: emp.salary - emp.advance,
                        name: emp.name
                    };
                }
            });
        }


        function openEmployeeModal(isEdit = false, id = null) {
            document.getElementById('modal-employee').style.display = 'flex';
            if (isEdit && id) {
                document.getElementById('employee-modal-title').innerText = "Editar Funcionário";
                const emp = employeesList.find(e => String(e.id) === String(id));
                if (emp) {
                    document.getElementById('emp-edit-id').value = emp.id;
                    document.getElementById('emp-name').value = emp.name;
                    document.getElementById('emp-cpf').value = emp.cpf;
                    document.getElementById('emp-contact').value = emp.contact || "";
                    document.getElementById('emp-role').value = emp.role;
                    document.getElementById('emp-admission-date').value = emp.admission_date || "";
                    document.getElementById('emp-salary').value = emp.salary;
                    document.getElementById('emp-advance').value = emp.advance || 0;
                    document.getElementById('emp-earnings').value = JSON.stringify(emp.earnings || []);
                    document.getElementById('emp-status').value = emp.is_active ? "Ativo" : "Inativo";
                }
            } else {
                document.getElementById('employee-modal-title').innerText = "Incluir Funcionário";
                document.getElementById('emp-edit-id').value = "";
                document.getElementById('emp-name').value = "";
                document.getElementById('emp-cpf').value = "";
                document.getElementById('emp-contact').value = "";
                document.getElementById('emp-role').value = "";
                document.getElementById('emp-admission-date').value = new Date().toISOString().split('T')[0];
                document.getElementById('emp-salary').value = "";
                document.getElementById('emp-advance').value = "0.00";
                document.getElementById('emp-earnings').value = '[]';
                document.getElementById('emp-status').value = "Ativo";
            }
        }


        function closeEmployeeModal() {
            document.getElementById('modal-employee').style.display = 'none';
        }


        function filterEmployeesTable() {
            const term = document.getElementById('employees-search').value.toLowerCase().trim();
            const rows = document.querySelectorAll('#employee-table-rows tr');
            rows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 7) {
                    const match = cells[0].textContent.toLowerCase().includes(term) ||
                                  cells[1].textContent.toLowerCase().includes(term) ||
                                  cells[2].textContent.toLowerCase().includes(term);
                    row.style.display = match ? "" : "none";
                }
            });
        }


        function submitEmployeeForm(event) {
            event.preventDefault();
            try {
                const id = document.getElementById('emp-edit-id').value;
                const name = document.getElementById('emp-name').value;
                const cpf = document.getElementById('emp-cpf').value;
                const contact = document.getElementById('emp-contact').value;
                const role = document.getElementById('emp-role').value;
                const admission = document.getElementById('emp-admission-date').value;
                const salary = parseFloat(document.getElementById('emp-salary').value) || 0;
                const advance = parseFloat(document.getElementById('emp-advance').value) || 0;
                const status = document.getElementById('emp-status').value === "Ativo";
                
                let earnings = [];
                try {
                    earnings = JSON.parse(document.getElementById('emp-earnings').value || '[]');
                } catch(pe) {
                    earnings = [];
                }

                if (id) {
                    // Edit
                    const emp = employeesList.find(e => String(e.id) === String(id));
                    if (emp) {
                        emp.name = name;
                        emp.cpf = cpf;
                        emp.contact = contact;
                        emp.role = role;
                        emp.admission_date = admission;
                        emp.salary = salary;
                        emp.advance = advance;
                        emp.earnings = earnings;
                        emp.is_active = status;
                    }
                } else {
                    // Create
                    const newId = 'emp-' + Math.floor(Math.random() * 100000);
                    employeesList.push({
                        id: newId,
                        name,
                        cpf,
                        contact,
                        role,
                        admission_date: admission,
                        salary,
                        advance,
                        earnings,
                        is_active: status
                    });
                }

                saveLocalEmployeesToCache();
                renderEmployees();
                closeEmployeeModal();
                showToast("Funcionário salvo com sucesso!");

                // Sync with Supabase
                if (supabaseClient) {
                    const updateData = {
                        name,
                        cpf,
                        contact,
                        role,
                        admission_date: admission,
                        salary,
                        advance,
                        earnings,
                        is_active: status
                    };
                    if (id) {
                        Promise.resolve(dbClient.from('employees').update(updateData).eq('id', id)).catch(() => {});
                    } else {
                        Promise.resolve(dbClient.from('employees').insert([updateData])).catch(() => {});
                    }
                }
            } catch(e) {
                console.error("Error submitting employee form:", e);
                showToast("Erro ao salvar funcionário! " + e.message, "error");
            }
        }


        function deleteEmployee(id) {
            if (confirm("Tem certeza que deseja excluir o registro deste funcionário?")) {
                employeesList = employeesList.filter(e => String(e.id) !== String(id));
                saveLocalEmployeesToCache();
                renderEmployees();
                showToast("Registro excluído com sucesso.");

                if (supabaseClient) {
                    dbClient.from('employees').delete().eq('id', id).catch(() => {});
                }
            }
        }


        function saveLocalEmployeesToCache() {
            SafeStorage.setItem('condosphere_employees', JSON.stringify(employeesList));
        }


        function renderEmployees() {
            const tbody = document.getElementById('employee-table-rows');
            if (!tbody) return;
            tbody.innerHTML = '';

            employeesList.forEach(emp => {
                const tr = document.createElement('tr');
                tr.id = 'emp-row-' + emp.id;
                
                const formatSalary = emp.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const formatAdvance = emp.advance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                
                let formatAdmission = emp.admission_date;
                if (formatAdmission && formatAdmission.includes("-")) {
                    const parts = formatAdmission.split("-");
                    formatAdmission = `${parts[2]}/${parts[1]}/${parts[0]}`;
                }

                tr.innerHTML = `
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.cpf}</td>
                    <td>${emp.role}</td>
                    <td style="color:var(--color-success); font-weight:bold">${formatSalary}</td>
                    <td style="color:var(--color-danger)">${formatAdvance}</td>
                    <td>${emp.contact || '-'}</td>
                    <td>${formatAdmission || '-'}</td>
                    <td><span class="badge ${emp.is_active ? 'badge-success' : 'badge-secondary'}">${emp.is_active ? 'Ativo' : 'Inativo'}</span></td>
                    <td>
                        <div style="display:flex; align-items:center; justify-content:center; gap:6px">
                            <button class="action-icon" style="color:var(--color-primary); border:none; background:none" title="Alterar" onclick="openEmployeeModal(true, '${emp.id}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M3 17.25V21h4.25L17.81 9.94l-4.25-4.25L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 4.25 4.25 1.83-1.83z"/>
                                </svg>
                            </button>
                            <button class="action-icon" style="color:var(--color-danger); border:none; background:none" title="Excluir" onclick="deleteEmployee('${emp.id}')">
                                <svg style="width:16px; height:16px; fill:currentColor" viewBox="0 0 24 24">
                                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5L9 4H5v2h14V4z"/>
                                </svg>
                            </button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Sync the payrollDatabase
            syncPayrollDatabaseFromEmployees();

            // Re-populate the employee selection inside DP & Folha de Pagamento!
            renderDynamicPayrollTable();
            populateEmployeeDropdowns();
        }


        function populateEmployeeDropdowns() {
            // Select in registrar adiantamento
            const selectAdv = document.getElementById('adv-employee');
            if (selectAdv) {
                selectAdv.innerHTML = '';
                employeesList.forEach(emp => {
                    if (emp.is_active) {
                        const opt = document.createElement('option');
                        opt.value = emp.name;
                        opt.setAttribute('data-role', emp.role);
                        opt.innerText = `${emp.name} (${emp.role})`;
                        selectAdv.appendChild(opt);
                    }
                });
            }
        }


        function renderDynamicPayrollTable() {
            const tbody = document.getElementById('payroll-table-rows');
            if (!tbody) return;
            tbody.innerHTML = '';

            employeesList.forEach(emp => {
                if (emp.is_active) {
                    const tr = document.createElement('tr');
                    tr.style.cursor = 'pointer';
                    tr.onclick = function() { openPayrollCalculatorModal(emp.id); };
                    
                    const formatSalary = emp.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    const formatAdvance = emp.advance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                    
                    // calculate dynamic net
                    const netSalary = (emp.salary - emp.advance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

                    tr.innerHTML = `
                        <td><strong>${emp.name}</strong></td>
                        <td>${emp.role}</td>
                        <td>${formatSalary}</td>
                        <td id="payroll-adv-${emp.id}" style="color:var(--color-danger)">${formatAdvance}</td>
                        <td id="payroll-net-${emp.id}" style="font-weight:700; color:white">${netSalary}</td>
                        <td style="text-align:center"><button class="btn btn-secondary" style="font-size:0.65rem; padding:4px 8px">⚙️ Calcular</button></td>
                    `;
                    tbody.appendChild(tr);
                }
            });
        }

        let employeesList = [];
