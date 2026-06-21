const DOC_SUPABASE_URL = 'https://psbvjscrqhwhttvbstty.supabase.co';
const DOC_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYnZqc2NycWh3aHR0dmJzdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTA4MzAsImV4cCI6MjA5Njg2NjgzMH0.AFnX7TYKrpTSQMBEU9Rwj0g8nvgpSEDKSjGNb-FM2Gw';

let docFolders = [];
let docDocuments = [];

async function docSupabaseQuery(table, select, filters) {
    select = select || '*';
    filters = filters || {};
    let url = DOC_SUPABASE_URL + '/rest/v1/' + table + '?select=' + select;
    for (const [key, value] of Object.entries(filters)) {
        url += '&' + key + '=eq.' + encodeURIComponent(value);
    }
    const res = await fetch(url, { headers: { 'apikey': DOC_SUPABASE_KEY, 'Authorization': 'Bearer ' + DOC_SUPABASE_KEY } });
    return await res.json();
}

async function loadFolders() {
    docFolders = await docSupabaseQuery('document_folders', '*');
    renderFolders();
}

async function loadDocuments() {
    docDocuments = await docSupabaseQuery('documents', '*');
    renderDocDocuments();
}

function renderFolders() {
    const container = document.getElementById('folders-container');
    if (!container) return;
    if (docFolders.length === 0) {
        container.innerHTML = '<p style="color:var(--color-text-muted); text-align:center; padding:20px">Nenhuma pasta criada</p>';
        return;
    }
    container.innerHTML = docFolders.map(function(f) {
        return '<div class="folder-card" onclick="filterByFolder(\'' + f.id + '\')"><div class="folder-icon">📁</div><div class="folder-name">' + f.name + '</div><div class="folder-count">' + docDocuments.filter(function(d) { return d.category === f.name; }).length + ' documentos</div></div>';
    }).join('');
}

function renderDocDocuments(docList) {
    const container = document.getElementById('docs-container');
    if (!container) return;
    var docs = docList || docDocuments;
    if (docs.length === 0) {
        container.innerHTML = '<p style="color:var(--color-text-muted); text-align:center; padding:20px">Nenhum documento encontrado</p>';
        return;
    }
    var icons = { 'contrato': '📋', 'boleto': '💰', 'ata': '📝', 'relatorio': '📊', 'comunicado': '📢', 'regulamento': '📜', 'outro': '📄' };
    container.innerHTML = docs.map(function(d) {
        return '<div class="doc-item"><div class="doc-icon" style="background:rgba(59,130,246,0.1)">' + (icons[d.category] || '📄') + '</div><div class="doc-info"><div class="doc-title">' + d.title + '</div><div class="doc-meta">' + d.category + ' • ' + new Date(d.created_at).toLocaleDateString('pt-BR') + '</div></div><div class="doc-actions"><button class="btn btn-secondary btn-sm" onclick="downloadDoc(\'' + (d.file_url || '#') + '\')">Baixar</button><button class="btn btn-danger btn-sm" onclick="deleteDoc(\'' + d.id + '\')">Excluir</button></div></div>';
    }).join('');
}

function filterByFolder(folderId) {
    var folder = docFolders.find(function(f) { return f.id === folderId; });
    if (!folder) return;
    var filtered = docDocuments.filter(function(d) { return d.category === folder.name; });
    renderDocDocuments(filtered);
}

function openFolderModal() { document.getElementById('folder-modal').style.display = 'flex'; }
function closeFolderModal() { document.getElementById('folder-modal').style.display = 'none'; }

function openUploadModal() {
    var select = document.getElementById('doc-folder');
    select.innerHTML = '<option value="">Nenhuma pasta</option>';
    docFolders.forEach(function(f) { select.innerHTML += '<option value="' + f.id + '">' + f.name + '</option>'; });
    document.getElementById('upload-modal').style.display = 'flex';
}
function closeUploadModal() { document.getElementById('upload-modal').style.display = 'none'; }

function downloadDoc(url) { if (url && url !== '#') window.open(url, '_blank'); else alert('Arquivo não disponível para download'); }

async function deleteDoc(id) {
    if (!confirm('Excluir este documento?')) return;
    await fetch(DOC_SUPABASE_URL + '/rest/v1/documents?id=eq.' + id, {
        method: 'DELETE',
        headers: { 'apikey': DOC_SUPABASE_KEY, 'Authorization': 'Bearer ' + DOC_SUPABASE_KEY }
    });
    await loadDocuments();
}

document.addEventListener('DOMContentLoaded', function() {
    var folderForm = document.getElementById('folder-form');
    if (folderForm) {
        folderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var cached = localStorage.getItem('currentUser');
            var user = cached ? JSON.parse(cached) : null;
            await fetch(DOC_SUPABASE_URL + '/rest/v1/document_folders', {
                method: 'POST',
                headers: { 'apikey': DOC_SUPABASE_KEY, 'Authorization': 'Bearer ' + DOC_SUPABASE_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: document.getElementById('folder-name').value,
                    description: document.getElementById('folder-desc').value,
                    created_by: user ? user.id : null
                })
            });
            closeFolderModal();
            await loadFolders();
        });
    }

    var uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            var cached = localStorage.getItem('currentUser');
            var user = cached ? JSON.parse(cached) : null;
            var file = document.getElementById('doc-file').files[0];
            await fetch(DOC_SUPABASE_URL + '/rest/v1/documents', {
                method: 'POST',
                headers: { 'apikey': DOC_SUPABASE_KEY, 'Authorization': 'Bearer ' + DOC_SUPABASE_KEY, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: document.getElementById('doc-title').value,
                    description: document.getElementById('doc-desc').value,
                    category: document.getElementById('doc-category').value,
                    file_url: file ? URL.createObjectURL(file) : null,
                    file_type: file ? file.type : null,
                    file_size: file ? file.size : 0,
                    is_public: document.getElementById('doc-public').checked,
                    uploaded_by: user ? user.id : null
                })
            });
            closeUploadModal();
            await loadDocuments();
            alert('Documento enviado com sucesso!');
        });
    }

    loadFolders();
    loadDocuments();
});
