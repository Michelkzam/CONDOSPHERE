/* =====================================================================
   CONDOSPHERE - JavaScript Compartilhado (app.js)
   Funções CRUD, Data Layer, Render, Filtros
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

// === TOAST (parent communication) ===
function showToast(msg, type) {
    type = type || 'success';
    try {
        window.parent.postMessage({ type: 'toast', msg: msg, toastType: type }, '*');
    } catch(e) {}
    // Also show locally if not in iframe
    if (window === window.parent) {
        const c = document.getElementById('toast-container');
        if (c) {
            const t = document.createElement('div');
            t.className = 'toast ' + type;
            t.textContent = msg;
            c.appendChild(t);
            setTimeout(() => t.remove(), 3500);
        }
    }
}

// === MODAL HELPERS ===
function openModal(id) { var el = document.getElementById(id); if (el) el.style.display = 'flex'; }
function closeModal(id) { var el = document.getElementById(id); if (el) el.style.display = 'none'; }

// === RESIDENCES ===
function loadResidencesFromCache() {
    var cached = SafeStorage.getItem('condosphere_residences');
    if (cached) {
        try { residencesList = JSON.parse(cached); } catch(e) { residencesList = []; }
    }
    renderResidences();
}

function renderResidences() {
    var tbody = document.querySelector('#res-tbody');
    if (!tbody) return;
    if (residencesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:15px">Nenhuma residência cadastrada.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    residencesList.forEach(function(r) {
        var statusClass = r.status === 'Ativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + r.identifier + '</td>' +
            '<td>' + (r.owner || '-') + '</td>' +
            '<td>' + (r.address || '-') + '</td>' +
            '<td>' + (r.profile_name || 'Perfil Padrão') + '</td>' +
            '<td>R$ ' + (r.base_value || 300).toFixed(2) + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + (r.status || 'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" title="Editar" onclick="editResidence(' + residencesList.indexOf(r) + ')">✎</button>' +
            '<button class="action-btn delete" title="Excluir" onclick="deleteResidence(' + residencesList.indexOf(r) + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function addResidence(identifier, owner, address, profileName, baseValue, status) {
    residencesList.push({
        identifier: identifier,
        owner: owner || 'Sem Proprietário',
        address: address || '-',
        profile_name: profileName || 'Perfil Padrão',
        base_value: baseValue || 300,
        status: status || 'Ativo'
    });
    saveResidencesToCache();
    renderResidences();
    showToast('Residência "' + identifier + '" cadastrada com sucesso!');
}

function editResidence(idx) {
    var r = residencesList[idx];
    if (!r) return;
    var newOwner = prompt('Proprietário:', r.owner);
    if (newOwner !== null) {
        r.owner = newOwner;
        saveResidencesToCache();
        renderResidences();
        showToast('Residência atualizada!');
    }
}

function deleteResidence(idx) {
    if (confirm('Tem certeza que deseja excluir esta residência?')) {
        var r = residencesList.splice(idx, 1)[0];
        saveResidencesToCache();
        renderResidences();
        showToast('Residência "' + r.identifier + '" excluída!');
    }
}

function saveResidencesToCache() {
    SafeStorage.setItem('condosphere_residences', JSON.stringify(residencesList));
}

function filterResidences(term) {
    if (!term) { renderResidences(); return; }
    term = term.toLowerCase();
    var filtered = residencesList.filter(function(r) {
        return (r.identifier && r.identifier.toLowerCase().includes(term)) ||
               (r.owner && r.owner.toLowerCase().includes(term)) ||
               (r.address && r.address.toLowerCase().includes(term));
    });
    renderResidencesList(filtered);
}

function renderResidencesList(list) {
    var tbody = document.querySelector('#res-tbody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum resultado encontrado.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    list.forEach(function(r) {
        var idx = residencesList.indexOf(r);
        var statusClass = r.status === 'Ativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + r.identifier + '</td>' +
            '<td>' + (r.owner || '-') + '</td>' +
            '<td>' + (r.address || '-') + '</td>' +
            '<td>' + (r.profile_name || 'Perfil Padrão') + '</td>' +
            '<td>R$ ' + (r.base_value || 300).toFixed(2) + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + (r.status || 'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" title="Editar" onclick="editResidence(' + idx + ')">✎</button>' +
            '<button class="action-btn delete" title="Excluir" onclick="deleteResidence(' + idx + ')">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

// === RESIDENTS ===
function loadResidentsFromCache() {
    var cached = SafeStorage.getItem('condosphere_residents');
    if (cached) {
        try { residentsList = JSON.parse(cached); } catch(e) { residentsList = []; }
    }
}

function renderResidents() {
    var tbody = document.querySelector('#mor-tbody');
    if (!tbody) return;
    if (residentsList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum morador cadastrado.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    residentsList.forEach(function(r) {
        var statusClass = (r.status !== 'Inativo') ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + r.name + '</strong></td>' +
            '<td style="font-family:monospace">' + (r.cpf || '-') + '</td>' +
            '<td>' + (r.contact || '-') + '</td>' +
            '<td>' + (r.role || 'Morador') + '</td>' +
            '<td>' + (r.residence_name || '-') + '</td>' +
            '<td>' + (r.is_associated ? '✓' : '✕') + '</td>' +
            '<td>' + (r.is_resident ? '✓' : '✕') + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + (r.status || 'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" title="Editar">✎</button>' +
            '<button class="action-btn delete" title="Excluir">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

// === VEHICLES ===
function loadVehiclesFromCache() {
    var cached = SafeStorage.getItem('condosphere_vehicles');
    if (cached) {
        try { vehiclesList = JSON.parse(cached); } catch(e) { vehiclesList = []; }
    }
}

function renderVehicles() {
    var tbody = document.querySelector('#vei-tbody');
    if (!tbody) return;
    if (vehiclesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum veículo cadastrado.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    vehiclesList.forEach(function(v) {
        var statusClass = v.is_active !== false ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-weight:700; color:var(--primary)">' + (v.plate || '-') + '</td>' +
            '<td>' + (v.model || '-') + '</td>' +
            '<td>' + (v.color || '-') + '</td>' +
            '<td>' + (v.owner_name || '-') + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + (v.is_active !== false ? 'Ativo' : 'Inativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" title="Editar">✎</button>' +
            '<button class="action-btn delete" title="Excluir">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

// === PAYABLES ===
function loadPayablesFromCache() {
    var cached = SafeStorage.getItem('condosphere_payables');
    if (cached) {
        try { payablesList = JSON.parse(cached); } catch(e) { payablesList = []; }
    }
}

function renderPayables() {
    var tbody = document.querySelector('#pay-tbody');
    if (!tbody) return;
    if (payablesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted); padding:15px">Nenhuma despesa cadastrada.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    payablesList.forEach(function(p) {
        var statusClass = p.status === 'Pago' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td style="font-family:monospace; color:var(--text-muted)">#00' + p.id + '</td>' +
            '<td><strong>' + p.creditor + '</strong></td>' +
            '<td>' + p.description + '</td>' +
            '<td>' + p.dueDate + '</td>' +
            '<td>' + p.category + '</td>' +
            '<td style="font-weight:700">R$ ' + p.value.toFixed(2) + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + p.status + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            (p.status === 'Pendente' ? '<button class="action-btn view" title="Quitar" onclick="settlePayable(' + p.id + ')">✓</button>' : '') +
            '<button class="action-btn edit" title="Editar">✎</button>' +
            '<button class="action-btn delete" title="Excluir">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

function settlePayable(id) {
    payablesList = payablesList.map(function(p) {
        if (p.id === id) p.status = 'Pago';
        return p;
    });
    savePayablesToCache();
    renderPayables();
    showToast('Conta quitada com sucesso!');
}

function savePayablesToCache() {
    SafeStorage.setItem('condosphere_payables', JSON.stringify(payablesList));
}

// === EMPLOYEES ===
function loadEmployeesFromCache() {
    var cached = SafeStorage.getItem('condosphere_employees');
    if (cached) {
        try { employeesList = JSON.parse(cached); } catch(e) { employeesList = []; }
    }
}

function renderEmployees() {
    var tbody = document.querySelector('#emp-tbody');
    if (!tbody) return;
    if (employeesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum funcionário cadastrado.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    employeesList.forEach(function(e) {
        var statusClass = e.is_active !== false ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + e.name + '</strong></td>' +
            '<td style="font-family:monospace">' + (e.cpf || '-') + '</td>' +
            '<td>' + (e.role || '-') + '</td>' +
            '<td>R$ ' + (e.salary || 0).toFixed(2) + '</td>' +
            '<td style="color:var(--danger)">R$ ' + (e.advance || 0).toFixed(2) + '</td>' +
            '<td>' + (e.contact || '-') + '</td>' +
            '<td>' + (e.admission_date || '-') + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + (e.is_active !== false ? 'Ativo' : 'Inativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" title="Editar">✎</button>' +
            '<button class="action-btn delete" title="Excluir">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

// === PRESTADORES ===
function loadPrestadoresFromCache() {
    var cached = SafeStorage.getItem('condosphere_prestadores');
    if (cached) {
        try { prestadoresList = JSON.parse(cached); } catch(e) { prestadoresList = []; }
    }
}

function renderPrestadores() {
    var tbody = document.querySelector('#prov-tbody');
    if (!tbody) return;
    if (prestadoresList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:15px">Nenhum prestador cadastrado.</td></tr>';
        return;
    }
    tbody.innerHTML = '';
    prestadoresList.forEach(function(p) {
        var statusClass = p.status === 'Ativo' ? 'badge-success' : 'badge-danger';
        var row = document.createElement('tr');
        row.innerHTML = '<td><strong>' + p.company + '</strong></td>' +
            '<td style="font-family:monospace">' + (p.cnpj || '-') + '</td>' +
            '<td>' + (p.service || '-') + '</td>' +
            '<td>R$ ' + (p.contract_value || 0).toFixed(2) + '</td>' +
            '<td><span class="badge ' + statusClass + '">' + (p.status || 'Ativo') + '</span></td>' +
            '<td style="text-align:center"><div class="actions-cell">' +
            '<button class="action-btn edit" title="Editar">✎</button>' +
            '<button class="action-btn delete" title="Excluir">✕</button>' +
            '</div></td>';
        tbody.appendChild(row);
    });
}

// === USERS ===
function loadUsersFromCache() {
    var cached = SafeStorage.getItem('condosphere_users');
    if (cached) {
        try { usersList = JSON.parse(cached); } catch(e) { usersList = []; }
    }
}

// === UNIVERSAL TABLE DELETE ===
function deleteTableRow(btn, name) {
    if (!confirm('Tem certeza que deseja excluir "' + name + '"?')) return;
    var row = btn.closest('tr');
    row.style.transition = 'all 0.3s ease';
    row.style.opacity = '0';
    row.style.transform = 'scale(0.95)';
    setTimeout(function() { row.remove(); }, 300);
    showToast('Registro "' + name + '" excluído!');
}

// === UNIVERSAL SEARCH ===
function universalSearch(input, list, renderFn, fields) {
    var term = input.value.toLowerCase().trim();
    if (!term) { renderFn(list); return; }
    var filtered = list.filter(function(item) {
        return fields.some(function(f) {
            return item[f] && String(item[f]).toLowerCase().includes(term);
        });
    });
    renderFn(filtered);
}

// === INIT ALL DATA ===
function initAllData() {
    loadResidencesFromCache();
    loadResidentsFromCache();
    loadVehiclesFromCache();
    loadPayablesFromCache();
    loadEmployeesFromCache();
    loadPrestadoresFromCache();
    loadUsersFromCache();

    // Render whichever page is active
    var tbody;
    if (tbody = document.querySelector('#res-tbody')) renderResidences();
    if (tbody = document.querySelector('#mor-tbody')) renderResidents();
    if (tbody = document.querySelector('#vei-tbody')) renderVehicles();
    if (tbody = document.querySelector('#pay-tbody')) renderPayables();
    if (tbody = document.querySelector('#emp-tbody')) renderEmployees();
    if (tbody = document.querySelector('#prov-tbody')) renderPrestadores();
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllData);
} else {
    initAllData();
}
