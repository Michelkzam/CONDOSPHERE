/* =====================================================================
   CONDOSPHERE - JavaScript Compartilhado (app.js)
   Funções CRUD completas, Data Layer, Render, Filtros, Exportação
   ===================================================================== */

// === SAFE STORAGE ===
const SafeStorage = {
    getItem(k) { try { return localStorage.getItem(k); } catch(e) { return null; } },
    setItem(k,v) { try { localStorage.setItem(k,v); } catch(e) {} },
    removeItem(k) { try { localStorage.removeItem(k); } catch(e) {} }
};

// === GLOBAL DATA ARRAYS ===
let residencesList = [];
let residentsList = [];
let vehiclesList = [];
let payablesList = [];
let receivablesList = [];
let employeesList = [];
let prestadoresList = [];
let assembliesList = [];
let visitorLogs = [];
let usersList = [];

// === TOAST ===
function showToast(msg, type) {
    type = type || 'success';
    try { window.parent.postMessage({ type: 'toast', msg: msg, toastType: type }, '*'); } catch(e) {}
    if (window === window.parent) {
        var c = document.getElementById('toast-container');
        if (c) {
            var t = document.createElement('div');
            t.className = 'toast ' + type;
            t.textContent = msg;
            c.appendChild(t);
            setTimeout(function() { t.remove(); }, 3500);
        }
    }
}

// === MODAL HELPERS ===
function openModal(id) { var el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function closeModal(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }

// === EXPORT TO XLSX (CSV fallback) ===
function exportToCSV(filename, headers, rows) {
    var csv = '\uFEFF'; // BOM for Excel UTF-8
    csv += headers.join(';') + '\n';
    rows.forEach(function(row) {
        csv += row.map(function(cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(';') + '\n';
    });
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Arquivo "' + filename + '" exportado com sucesso!');
}

// === UNIVERSAL SEARCH ===
function universalSearch(input, list, renderFn, fields) {
    var term = (input.value || '').toLowerCase().trim();
    if (!term) { renderFn(list); return; }
    var filtered = list.filter(function(item) {
        return fields.some(function(f) {
            return item[f] && String(item[f]).toLowerCase().includes(term);
        });
    });
    renderFn(filtered);
}

// === UNIVERSAL TABLE DELETE (row-based) ===
function deleteTableRow(btn, name) {
    if (!confirm('Tem certeza que deseja excluir "' + name + '"?')) return;
    var row = btn.closest('tr');
    row.style.transition = 'all 0.3s ease';
    row.style.opacity = '0';
    row.style.transform = 'scale(0.95)';
    setTimeout(function() { row.remove(); }, 300);
    showToast('Registro "' + name + '" excluído!');
}

// =====================================================================
// RESIDENCES
// =====================================================================
function loadResidencesFromCache() {
    var cached = SafeStorage.getItem('condosphere_residences');
    if (cached) { try { residencesList = JSON.parse(cached); } catch(e) { residencesList = []; } }
}

function renderResidences() {
    var tbody = document.querySelector('#res-tbody');
    if (!tbody) return;
    if (residencesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:15px">Nenhuma residência cadastrada.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    residencesList.forEach(function(r, i) {
        var sc = r.status === 'Ativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + r.identifier + '</td>' +
            '<td>' + (r.owner || '-') + '</td><td>' + (r.address || '-') + '</td>' +
            '<td>' + (r.profile_name || 'Perfil Padrão') + '</td>' +
            '<td>R$ ' + (r.base_value || 300).toFixed(2) + '</td>' +
            '<td><span class="badge ' + sc + '">' + (r.status || 'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editResidence(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteResidence(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}
function renderResidencesList(list) { renderResidencesFromList(list); }
function renderResidencesFromList(list) {
    var tbody = document.querySelector('#res-tbody');
    if (!tbody) return;
    if (!list || list.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum resultado.</td></tr>'; return; }
    tbody.innerHTML = '';
    list.forEach(function(r) {
        var i = residencesList.indexOf(r);
        var sc = r.status === 'Ativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + r.identifier + '</td>' +
            '<td>' + (r.owner || '-') + '</td><td>' + (r.address || '-') + '</td>' +
            '<td>' + (r.profile_name || 'Perfil Padrão') + '</td>' +
            '<td>R$ ' + (r.base_value || 300).toFixed(2) + '</td>' +
            '<td><span class="badge ' + sc + '">' + (r.status || 'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editResidence(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteResidence(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addResidence(identifier, owner, address, profileName, baseValue, status) {
    residencesList.push({ identifier: identifier, owner: owner || 'Sem Proprietário', address: address || '-', profile_name: profileName || 'Perfil Padrão', base_value: baseValue || 300, status: status || 'Ativo' });
    saveResidencesToCache(); renderResidences();
    showToast('Residência "' + identifier + '" cadastrada!');
}

function editResidence(idx) {
    var r = residencesList[idx]; if (!r) return;
    var o = prompt('Proprietário:', r.owner); if (o === null) return;
    var a = prompt('Endereço:', r.address); if (a === null) return;
    var v = parseFloat(prompt('Valor Base:', r.base_value)); if (isNaN(v)) v = r.base_value;
    r.owner = o; r.address = a; r.base_value = v;
    saveResidencesToCache(); renderResidences();
    showToast('Residência "' + r.identifier + '" atualizada!');
}

function deleteResidence(idx) {
    if (!confirm('Excluir residência "' + residencesList[idx].identifier + '"?')) return;
    var r = residencesList.splice(idx, 1)[0];
    saveResidencesToCache(); renderResidences();
    showToast('Residência "' + r.identifier + '" excluída!');
}

function saveResidencesToCache() { SafeStorage.setItem('condosphere_residences', JSON.stringify(residencesList)); }

function exportResidences() {
    var headers = ['Identificador','Proprietário','Endereço','Perfil','Valor Base','Status'];
    var rows = residencesList.map(function(r) { return [r.identifier, r.owner, r.address, r.profile_name, r.base_value, r.status]; });
    exportToCSV('residencias.csv', headers, rows);
}

// =====================================================================
// RESIDENTS
// =====================================================================
function loadResidentsFromCache() {
    var cached = SafeStorage.getItem('condosphere_residents');
    if (cached) { try { residentsList = JSON.parse(cached); } catch(e) { residentsList = []; } }
}

function renderResidents() {
    var tbody = document.querySelector('#mor-tbody');
    if (!tbody) return;
    if (residentsList.length === 0) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum morador cadastrado.</td></tr>'; return; }
    tbody.innerHTML = '';
    residentsList.forEach(function(r, i) {
        var sc = r.status !== 'Inativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + r.name + '</strong></td>' +
            '<td style="font-family:monospace">' + (r.cpf||'-') + '</td><td>' + (r.contact||'-') + '</td>' +
            '<td>' + (r.role||'Morador') + '</td><td>' + (r.residence_name||'-') + '</td>' +
            '<td>' + (r.is_associated?'✓':'✕') + '</td><td>' + (r.is_resident?'✓':'✕') + '</td>' +
            '<td><span class="badge ' + sc + '">' + (r.status||'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editResident(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteResident(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function renderResidentsFiltered(list) { renderResidentsFromList(list); }
function renderResidentsFromList(list) {
    var tbody = document.querySelector('#mor-tbody');
    if (!tbody) return;
    if (!list || list.length === 0) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum resultado.</td></tr>'; return; }
    tbody.innerHTML = '';
    list.forEach(function(r) {
        var i = residentsList.indexOf(r);
        var sc = r.status !== 'Inativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + r.name + '</strong></td>' +
            '<td style="font-family:monospace">' + (r.cpf||'-') + '</td><td>' + (r.contact||'-') + '</td>' +
            '<td>' + (r.role||'Morador') + '</td><td>' + (r.residence_name||'-') + '</td>' +
            '<td>' + (r.is_associated?'✓':'✕') + '</td><td>' + (r.is_resident?'✓':'✕') + '</td>' +
            '<td><span class="badge ' + sc + '">' + (r.status||'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editResident(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteResident(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addResident(name, cpf, contact, role, residence, isAssociated, isResident) {
    residentsList.push({ name:name, cpf:cpf||'', contact:contact||'', role:role||'Morador', residence_name:residence||'-', is_associated:!!isAssociated, is_resident:isResident!==false, status:'Ativo' });
    saveResidentsToCache(); renderResidents();
    showToast('Morador "' + name + '" cadastrado!');
}

function editResident(idx) {
    var r = residentsList[idx]; if (!r) return;
    var n = prompt('Nome:', r.name); if (n === null) return;
    var c = prompt('Contato:', r.contact); if (c === null) return;
    r.name = n; r.contact = c;
    saveResidentsToCache(); renderResidents();
    showToast('Morador atualizado!');
}

function deleteResident(idx) {
    if (!confirm('Excluir morador "' + residentsList[idx].name + '"?')) return;
    residentsList.splice(idx, 1);
    saveResidentsToCache(); renderResidents();
    showToast('Morador excluído!');
}

function saveResidentsToCache() { SafeStorage.setItem('condosphere_residents', JSON.stringify(residentsList)); }

function exportResidents() {
    var headers = ['Nome','CPF','Contato','Função','Residência','Associado','Morador','Status'];
    var rows = residentsList.map(function(r) { return [r.name,r.cpf,r.contact,r.role,r.residence_name,r.is_associated?'Sim':'Não',r.is_resident?'Sim':'Não',r.status||'Ativo']; });
    exportToCSV('moradores.csv', headers, rows);
}

// =====================================================================
// VEHICLES
// =====================================================================
function loadVehiclesFromCache() {
    var cached = SafeStorage.getItem('condosphere_vehicles');
    if (cached) { try { vehiclesList = JSON.parse(cached); } catch(e) { vehiclesList = []; } }
}

function renderVehicles() {
    var tbody = document.querySelector('#vei-tbody');
    if (!tbody) return;
    if (vehiclesList.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum veículo cadastrado.</td></tr>'; return; }
    tbody.innerHTML = '';
    vehiclesList.forEach(function(v, i) {
        var sc = v.is_active !== false ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + (v.plate||'-') + '</td>' +
            '<td>' + (v.model||'-') + '</td><td>' + (v.color||'-') + '</td><td>' + (v.owner_name||'-') + '</td>' +
            '<td><span class="badge ' + sc + '">' + (v.is_active!==false?'Ativo':'Inativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editVehicle(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteVehicle(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function renderVehiclesFiltered(list) {
    var tbody = document.querySelector('#vei-tbody');
    if (!tbody) return;
    if (!list || list.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum resultado.</td></tr>'; return; }
    tbody.innerHTML = '';
    list.forEach(function(v) {
        var i = vehiclesList.indexOf(v);
        var sc = v.is_active !== false ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + (v.plate||'-') + '</td>' +
            '<td>' + (v.model||'-') + '</td><td>' + (v.color||'-') + '</td><td>' + (v.owner_name||'-') + '</td>' +
            '<td><span class="badge ' + sc + '">' + (v.is_active!==false?'Ativo':'Inativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editVehicle(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteVehicle(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addVehicle(plate, model, color, owner) {
    vehiclesList.push({ plate:plate, model:model||'', color:color||'', owner_name:owner||'', is_active:true });
    saveVehiclesToCache(); renderVehicles();
    showToast('Veículo "' + plate + '" cadastrado!');
}

function editVehicle(idx) {
    var v = vehiclesList[idx]; if (!v) return;
    var m = prompt('Marca/Modelo:', v.model); if (m === null) return;
    var c = prompt('Cor:', v.color); if (c === null) return;
    var o = prompt('Proprietário:', v.owner_name); if (o === null) return;
    v.model = m; v.color = c; v.owner_name = o;
    saveVehiclesToCache(); renderVehicles();
    showToast('Veículo "' + v.plate + '" atualizado!');
}

function deleteVehicle(idx) {
    if (!confirm('Excluir veículo "' + vehiclesList[idx].plate + '"?')) return;
    vehiclesList.splice(idx, 1);
    saveVehiclesToCache(); renderVehicles();
    showToast('Veículo excluído!');
}

function saveVehiclesToCache() { SafeStorage.setItem('condosphere_vehicles', JSON.stringify(vehiclesList)); }

function exportVehicles() {
    var headers = ['Placa','Veículo','Cor','Proprietário','Status'];
    var rows = vehiclesList.map(function(v) { return [v.plate,v.model,v.color,v.owner_name,v.is_active!==false?'Ativo':'Inativo']; });
    exportToCSV('veiculos.csv', headers, rows);
}

// =====================================================================
// PAYABLES
// =====================================================================
function loadPayablesFromCache() {
    var cached = SafeStorage.getItem('condosphere_payables');
    if (cached) { try { payablesList = JSON.parse(cached); } catch(e) { payablesList = []; } }
}

function renderPayables() {
    var tbody = document.querySelector('#pay-tbody');
    if (!tbody) return;
    if (payablesList.length === 0) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:15px">Nenhuma despesa cadastrada.</td></tr>'; return; }
    tbody.innerHTML = '';
    payablesList.forEach(function(p) {
        var sc = p.status === 'Pago' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-family:monospace; color:var(--text-muted)">#' + String(p.id).padStart(3,'0') + '</td>' +
            '<td><strong>' + p.creditor + '</strong></td><td>' + p.description + '</td>' +
            '<td>' + p.dueDate + '</td><td>' + p.category + '</td>' +
            '<td style="font-weight:700">R$ ' + p.value.toFixed(2) + '</td>' +
            '<td><span class="badge ' + sc + '">' + p.status + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            (p.status === 'Pendente' ? '<button class="action-btn view" onclick="settlePayable(' + p.id + ')">✓</button>' : '') +
            '<button class="action-btn edit" onclick="editPayable(' + p.id + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deletePayable(' + p.id + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addPayable(creditor, description, value, category, dueDate, recurrence) {
    var newId = payablesList.length > 0 ? Math.max.apply(null, payablesList.map(function(p){return p.id;})) + 1 : 1;
    payablesList.push({ id:newId, creditor:creditor, description:description, dueDate:dueDate, category:category, value:parseFloat(value)||0, status:'Pendente', recurrence:recurrence||'Única' });
    savePayablesToCache(); renderPayables();
    showToast('Despesa #' + newId + ' cadastrada!');
}

function editPayable(id) {
    var p = payablesList.find(function(x){return x.id===id;}); if (!p) return;
    var c = prompt('Fornecedor:', p.creditor); if (c === null) return;
    var d = prompt('Descrição:', p.description); if (d === null) return;
    var v = parseFloat(prompt('Valor:', p.value)); if (isNaN(v)) return;
    p.creditor = c; p.description = d; p.value = v;
    savePayablesToCache(); renderPayables();
    showToast('Despesa #' + p.id + ' atualizada!');
}

function deletePayable(id) {
    if (!confirm('Excluir esta despesa?')) return;
    payablesList = payablesList.filter(function(p){return p.id!==id;});
    savePayablesToCache(); renderPayables();
    showToast('Despesa excluída!');
}

function settlePayable(id) {
    payablesList = payablesList.map(function(p){if(p.id===id)p.status='Pago';return p;});
    savePayablesToCache(); renderPayables();
    showToast('Conta quitada com sucesso!');
}

function savePayablesToCache() { SafeStorage.setItem('condosphere_payables', JSON.stringify(payablesList)); }

function exportPayables() {
    var headers = ['Código','Fornecedor','Descrição','Vencimento','Categoria','Valor','Status'];
    var rows = payablesList.map(function(p){return ['#'+String(p.id).padStart(3,'0'),p.creditor,p.description,p.dueDate,p.category,'R$ '+p.value.toFixed(2),p.status];});
    exportToCSV('contas_a_pagar.csv', headers, rows);
}

// =====================================================================
// EMPLOYEES
// =====================================================================
function loadEmployeesFromCache() {
    var cached = SafeStorage.getItem('condosphere_employees');
    if (cached) { try { employeesList = JSON.parse(cached); } catch(e) { employeesList = []; } }
}

function renderEmployees() {
    var tbody = document.querySelector('#emp-tbody');
    if (!tbody) return;
    if (employeesList.length === 0) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum funcionário cadastrado.</td></tr>'; return; }
    tbody.innerHTML = '';
    employeesList.forEach(function(e, i) {
        var sc = e.is_active !== false ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + e.name + '</strong></td>' +
            '<td style="font-family:monospace">' + (e.cpf||'-') + '</td><td>' + (e.role||'-') + '</td>' +
            '<td>R$ ' + (e.salary||0).toFixed(2) + '</td>' +
            '<td style="color:var(--danger)">R$ ' + (e.advance||0).toFixed(2) + '</td>' +
            '<td>' + (e.contact||'-') + '</td><td>' + (e.admission_date||'-') + '</td>' +
            '<td><span class="badge ' + sc + '">' + (e.is_active!==false?'Ativo':'Inativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editEmployee(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteEmployee(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addEmployee(name, cpf, role, salary, contact) {
    employeesList.push({ name:name, cpf:cpf||'', role:role||'', salary:parseFloat(salary)||0, advance:0, contact:contact||'', admission_date:new Date().toLocaleDateString('pt-BR'), is_active:true });
    saveEmployeesToCache(); renderEmployees();
    showToast('Funcionário "' + name + '" cadastrado!');
}

function editEmployee(idx) {
    var e = employeesList[idx]; if (!e) return;
    var r = prompt('Cargo:', e.role); if (r === null) return;
    var s = parseFloat(prompt('Salário:', e.salary)); if (isNaN(s)) return;
    e.role = r; e.salary = s;
    saveEmployeesToCache(); renderEmployees();
    showToast('Funcionário "' + e.name + '" atualizado!');
}

function deleteEmployee(idx) {
    if (!confirm('Excluir funcionário "' + employeesList[idx].name + '"?')) return;
    employeesList.splice(idx, 1);
    saveEmployeesToCache(); renderEmployees();
    showToast('Funcionário excluído!');
}

function saveEmployeesToCache() { SafeStorage.setItem('condosphere_employees', JSON.stringify(employeesList)); }

function exportEmployees() {
    var headers = ['Nome','CPF','Cargo','Salário','Adiantamento','Contato','Admissão','Status'];
    var rows = employeesList.map(function(e){return [e.name,e.cpf,e.role,e.salary,e.advance,e.contact,e.admission_date,e.is_active!==false?'Ativo':'Inativo'];});
    exportToCSV('funcionarios.csv', headers, rows);
}

// =====================================================================
// PRESTADORES
// =====================================================================
function loadPrestadoresFromCache() {
    var cached = SafeStorage.getItem('condosphere_prestadores');
    if (cached) { try { prestadoresList = JSON.parse(cached); } catch(e) { prestadoresList = []; } }
}

function renderPrestadores() {
    var tbody = document.querySelector('#prov-tbody');
    if (!tbody) return;
    if (prestadoresList.length === 0) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum prestador cadastrado.</td></tr>'; return; }
    tbody.innerHTML = '';
    prestadoresList.forEach(function(p, i) {
        var sc = p.status === 'Ativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + p.company + '</strong></td>' +
            '<td style="font-family:monospace">' + (p.cnpj||'-') + '</td><td>' + (p.service||'-') + '</td>' +
            '<td>R$ ' + (p.contract_value||0).toFixed(2) + '</td>' +
            '<td><span class="badge ' + sc + '">' + (p.status||'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editPrestador(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deletePrestador(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addPrestador(company, cnpj, service, value) {
    prestadoresList.push({ company:company, cnpj:cnpj||'', service:service||'', contract_value:parseFloat(value)||0, status:'Ativo' });
    savePrestadoresToCache(); renderPrestadores();
    showToast('Prestador "' + company + '" cadastrado!');
}

function editPrestador(idx) {
    var p = prestadoresList[idx]; if (!p) return;
    var s = prompt('Serviço:', p.service); if (s === null) return;
    var v = parseFloat(prompt('Valor do contrato:', p.contract_value)); if (isNaN(v)) return;
    p.service = s; p.contract_value = v;
    savePrestadoresToCache(); renderPrestadores();
    showToast('Prestador atualizado!');
}

function deletePrestador(idx) {
    if (!confirm('Excluir prestador "' + prestadoresList[idx].company + '"?')) return;
    prestadoresList.splice(idx, 1);
    savePrestadoresToCache(); renderPrestadores();
    showToast('Prestador excluído!');
}

function savePrestadoresToCache() { SafeStorage.setItem('condosphere_prestadores', JSON.stringify(prestadoresList)); }

// =====================================================================
// USERS
// =====================================================================
function loadUsersFromCache() {
    var cached = SafeStorage.getItem('condosphere_users');
    if (cached) { try { usersList = JSON.parse(cached); } catch(e) { usersList = []; } }
}

function renderUsers() {
    var tbody = document.querySelector('#usr-tbody');
    if (!tbody) return;
    if (usersList.length === 0) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum usuário cadastrado.</td></tr>'; return; }
    tbody.innerHTML = '';
    usersList.forEach(function(u, i) {
        var sc = u.is_active !== false ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + u.full_name + '</strong></td>' +
            '<td style="font-family:monospace; color:var(--primary)">' + u.username + '</td>' +
            '<td style="font-family:monospace">' + (u.cpf||'-') + '</td>' +
            '<td>' + (u.profile||'-') + '</td>' +
            '<td>' + (u.link_type||'Nenhum') + '</td>' +
            '<td><span class="badge ' + sc + '">' + (u.is_active!==false?'Ativo':'Inativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" onclick="editUser(' + i + ')">✎</button>' +
            '<button class="action-btn delete" onclick="deleteUser(' + i + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addUser(fullName, username, cpf, profile) {
    usersList.push({ full_name:fullName, username:username, cpf:cpf||'', profile:profile||'Morador', link_type:'Nenhum', is_active:true });
    saveUsersToCache(); renderUsers();
    showToast('Usuário "' + username + '" cadastrado!');
}

function editUser(idx) {
    var u = usersList[idx]; if (!u) return;
    var p = prompt('Perfil:', u.profile); if (p === null) return;
    u.profile = p;
    saveUsersToCache(); renderUsers();
    showToast('Usuário atualizado!');
}

function deleteUser(idx) {
    if (!confirm('Excluir usuário "' + usersList[idx].username + '"?')) return;
    usersList.splice(idx, 1);
    saveUsersToCache(); renderUsers();
    showToast('Usuário excluído!');
}

function saveUsersToCache() { SafeStorage.setItem('condosphere_users', JSON.stringify(usersList)); }

// =====================================================================
// RECEIVABLES (Contas a Receber)
// =====================================================================
function renderReceivables() {
    var tbody = document.querySelector('#rec-tbody');
    if (!tbody) return;
    if (receivablesList.length === 0) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum lançamento.</td></tr>'; return; }
    tbody.innerHTML = '';
    receivablesList.forEach(function(r) {
        var penalty = r.status === 'Vencido' ? r.baseValue * 0.02 : 0;
        var interest = r.status === 'Vencido' ? r.baseValue * (0.01 * (r.delayDays / 30)) : 0;
        var total = r.baseValue + r.extraCharges + penalty + interest;
        var sc = r.status === 'Pago' ? 'badge-success' : (r.status === 'Vencido' ? 'badge-danger' : (r.status === 'Acordo' ? 'badge-info' : 'badge-warning'));
        var row = document.createElement('tr');
        row.innerHTML = '<td>' + r.identifier + '</td><td>' + r.owner + '</td><td>' + r.dueDate + '</td>' +
            '<td style="color:' + (r.delayDays>0?'var(--warning)':'var(--text-muted)') + '; font-weight:700">' + (r.delayDays>0?r.delayDays+' dias':'-') + '</td>' +
            '<td>R$ ' + r.baseValue.toFixed(2) + '</td><td style="color:var(--warning)">R$ ' + (penalty+interest).toFixed(2) + '</td>' +
            '<td style="font-weight:700">R$ ' + total.toFixed(2) + '</td>' +
            '<td><span class="badge ' + sc + '">' + r.status + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            (r.status!=='Pago'?'<button class="action-btn view" onclick="settleReceivable(' + r.id + ')">✓</button>':'') +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function settleReceivable(id) {
    receivablesList = receivablesList.map(function(r){if(r.id===id){r.status='Pago';r.delayDays=0;}return r;});
    renderReceivables();
    showToast('Fatura quitada com sucesso!');
}

// =====================================================================
// INIT
// =====================================================================
function initAllData() {
    loadResidencesFromCache();
    loadResidentsFromCache();
    loadVehiclesFromCache();
    loadPayablesFromCache();
    loadEmployeesFromCache();
    loadPrestadoresFromCache();
    loadUsersFromCache();
    loadReceivablesFromCache();

    var t;
    if (t = document.querySelector('#res-tbody')) renderResidences();
    if (t = document.querySelector('#mor-tbody')) renderResidents();
    if (t = document.querySelector('#vei-tbody')) renderVehicles();
    if (t = document.querySelector('#pay-tbody')) renderPayables();
    if (t = document.querySelector('#emp-tbody')) renderEmployees();
    if (t = document.querySelector('#prov-tbody')) renderPrestadores();
    if (t = document.querySelector('#usr-tbody')) renderUsers();
    if (t = document.querySelector('#rec-tbody')) renderReceivables();
}

function loadReceivablesFromCache() {
    var cached = SafeStorage.getItem('condosphere_receivables');
    if (cached) { try { receivablesList = JSON.parse(cached); } catch(e) { receivablesList = []; } }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllData);
} else {
    initAllData();
}
