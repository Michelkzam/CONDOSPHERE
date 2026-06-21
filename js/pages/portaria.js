
        function renderVisitorLogs() {
            const tbody = document.getElementById('table-logs-rows');
            tbody.innerHTML = '';

            visitorLogs.forEach(log => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                // Click handler triggers the high-fidelity modal details view requested
                row.setAttribute('onclick', `openVisitorDetailsModal(${log.id})`);

                const docImg = log.photoDoc || defaultDocSvg;
                const personImg = log.photoPerson || defaultPersonSvg;

                let vehicleMarkup = '<span style="color:var(--color-text-muted)">Nenhum</span>';
                if (log.vehicleType) {
                    vehicleMarkup = `
                        <span style="color:#f59e0b; font-weight:700">${log.vehicleType}</span><br>
                        <span style="font-size:0.7rem; font-family:monospace">${log.vehiclePlate.toUpperCase()}</span>
                    `;
                }

                row.innerHTML = `
                    <td><strong>${log.name}</strong><br><span style="font-size:0.7rem;color:var(--color-text-muted)">${log.doc}</span></td>
                    <td><img src="${docImg}" style="width:32px; height:32px; border-radius:4px; object-fit:cover; border:1px solid var(--color-border)"></td>
                    <td><img src="${personImg}" style="width:32px; height:32px; border-radius:4px; object-fit:cover; border:1px solid var(--color-border)"></td>
                    <td><span class="badge ${log.type === 'Prestador' ? 'badge-success' : 'badge-warning'}">${log.type}</span></td>
                    <td>${vehicleMarkup}</td>
                    <td>${log.authorizedBy}</td>
                    <td>${log.timestamp}</td>
                `;
                tbody.appendChild(row);
            });
        }


        /* OPEN VISITOR DETAILS MODAL SCREEN WITH RBAC SECURITY AND ADMIN ONLY ACTIONS requested */
        function openVisitorDetailsModal(id) {
            const log = visitorLogs.find(l => l.id === id);
            if (log) {
                document.getElementById('det-vis-id').value = id;
                document.getElementById('det-vis-name').innerText = log.name;
                document.getElementById('det-vis-doc').innerText = log.doc;
                document.getElementById('det-vis-auth').innerText = log.authorizedBy;
                document.getElementById('det-vis-time').innerText = log.timestamp;

                // Set Badge Type
                const badge = document.getElementById('det-vis-type-badge');
                badge.innerText = log.type;
                badge.className = `badge ${log.type === 'Prestador' ? 'badge-success' : 'badge-warning'}`;

                // Set Photos
                document.getElementById('det-img-doc').src = log.photoDoc || defaultDocSvg;
                document.getElementById('det-img-person').src = log.photoPerson || defaultPersonSvg;

                // Vehicle details mapping
                const vehSection = document.getElementById('det-veh-sub-section');
                if (log.vehicleType) {
                    document.getElementById('det-veh-type').innerText = log.vehicleType;
                    document.getElementById('det-veh-plate').innerText = log.vehiclePlate.toUpperCase();
                    document.getElementById('det-veh-desc').innerText = `${log.vehicleBrand} ${log.vehicleModel} (${log.vehicleColor})`;
                    vehSection.style.display = 'flex';
                } else {
                    vehSection.style.display = 'none';
                }

                // SECURITY CHECK (RBAC): Show Edit/Delete only for 'Administrador' profile
                const activeRole = document.getElementById('active-user-role').value;
                const editBtn = document.getElementById('btn-det-edit');
                const deleteBtn = document.getElementById('btn-det-delete');

                if (activeRole === 'Administrador') {
                    editBtn.style.display = 'inline-flex';
                    deleteBtn.style.display = 'inline-flex';
                } else {
                    editBtn.style.display = 'none';
                    deleteBtn.style.display = 'none';
                }

                document.getElementById('visitor-details-modal').style.display = 'flex';
            }
        }


        function closeVisitorDetailsModal() {
            document.getElementById('visitor-details-modal').style.display = 'none';
        }


        // Open click-to-zoom fullscreen lightbox preview as requested
        function zoomVisitorImage(src) {
            if (!src || src === "") return;
            document.getElementById('lightbox-img').src = src;
            document.getElementById('image-lightbox-modal').style.display = 'flex';
            showToast("Toque em qualquer lugar para fechar a imagem ampliada!");
        }


        function closeLightboxModal() {
            document.getElementById('image-lightbox-modal').style.display = 'none';
        }


        // Print specific visitor details card in beautiful A4 format (Aprovado!)
        function printVisitorLogCard() {
            const id = parseInt(document.getElementById('det-vis-id').value);
            const log = visitorLogs.find(l => l.id === id);
            if (log) {
                document.getElementById('print-vis-name').innerText = log.name;
                document.getElementById('print-vis-doc').innerText = log.doc;
                document.getElementById('print-vis-type').innerText = log.type;
                document.getElementById('print-vis-auth').innerText = log.authorizedBy;
                document.getElementById('print-vis-time').innerText = log.timestamp;

                // Photo previews
                document.getElementById('print-vis-img-doc').src = log.photoDoc || defaultDocSvg;
                document.getElementById('print-vis-img-person').src = log.photoPerson || defaultPersonSvg;

                // Vehicle info block
                const vehBlock = document.getElementById('print-vis-veh-block');
                if (log.vehicleType) {
                    document.getElementById('print-vis-veh-type').innerText = log.vehicleType;
                    document.getElementById('print-vis-veh-plate').innerText = log.vehiclePlate.toUpperCase();
                    document.getElementById('print-vis-veh-desc').innerText = `${log.vehicleBrand} ${log.vehicleModel} (${log.vehicleColor})`;
                    vehBlock.style.display = 'flex';
                } else {
                    vehBlock.style.display = 'none';
                }

                // Setup print sections visibility
                document.getElementById('salary-advance-print-section').style.display = 'none';
                document.getElementById('receivable-report-print-section').style.display = 'none';
                document.getElementById('visitor-card-print-section').style.display = 'block';

                showToast("Preparando impressão da Ficha de Acesso...");
                setTimeout(() => {
                    window.print();
                }, 300);
            }
        }


        // Delete visitor record action (Strictly Admin only!)
        function deleteVisitorLogFromModal() {
            const id = parseInt(document.getElementById('det-vis-id').value);
            if (confirm("Tem certeza que deseja apagar permanentemente este registro de acesso?")) {
                visitorLogs = visitorLogs.filter(l => l.id !== id);
                renderVisitorLogs();
                closeVisitorDetailsModal();
                showToast("Registro de portaria excluído pelo Administrador.");
            }
        }


        /* QUICK RESIDENT ASSOCIATION CHECKER (Novo!) */

        /* DYNAMIC VISITOR AUTH DROPDOWN LOADER */
        function populateVisitorAuthDropdown() {
            const select = document.getElementById('visitor-auth');
            if (!select) return;
            select.innerHTML = "";

            const morRows = Array.from(document.querySelectorAll('#tab-moradores table tbody tr'));
            let count = 0;
            morRows.forEach(row => {
                const cells = row.getElementsByTagName('td');
                if (cells.length >= 5) {
                    const name = cells[0].textContent.trim();
                    const ident = cells[4].textContent.trim();
                    const opt = document.createElement('option');
                    opt.value = `${name} (${ident})`;
                    opt.innerText = `${name} (${ident})`;
                    select.appendChild(opt);
                    count++;
                }
            });
            if (count === 0) {
                select.innerHTML = '<option value="Nenhum Morador">Nenhum Morador Cadastrado</option>';
            }
        }


        function queryGateResident() {
            const raw = document.getElementById('gate-resident-query').value;
            const query = raw.trim().toLowerCase();
            const resultsDiv = document.getElementById('gate-resident-results');
            
            if (!query) {
                resultsDiv.innerHTML = `<p style="font-size:0.75rem; color:var(--color-text-muted); text-align:center; padding:10px">Digite um nome ou lote para consultar...</p>`;
                return;
            }

            console.log('[PORTARIA SEARCH] Query:', query);

            const words = query.split(/\s+/).filter(w => w.length > 0);

            // Helper: identifier match uses startsWith (strict)
            function identMatch(str) {
                if (!str) return false;
                const s = str.toLowerCase();
                return s === query || words.some(w => s.startsWith(w) || s === w);
            }

            // Helper: name/contact match uses includes (broad)
            function textMatch(str) {
                if (!str) return false;
                const s = str.toLowerCase();
                return words.some(w => s.includes(w));
            }

            const cachedResData = window._residencesData;
            const cachedResidentsData = window._residentsData;
            const residencesMap = {};
            const matchingResIdents = new Set();

            // --- SCAN RESIDENCES ---
            function addResidence(identifier, owner, address) {
                residencesMap[identifier] = { owner, address };
                if (identMatch(identifier) || textMatch(owner) || textMatch(address)) {
                    matchingResIdents.add(identifier.toLowerCase());
                }
            }

            // DOM
            Array.from(document.querySelectorAll('#table-residencias-list tbody tr')).forEach(row => {
                const c = row.getElementsByTagName('td');
                if (c.length >= 3) addResidence(c[0].textContent.trim(), c[1].textContent.trim(), c[2].textContent.trim());
            });

            // window cache
            if (cachedResData && Array.isArray(cachedResData)) {
                cachedResData.forEach(r => addResidence(r.identifier, r.owner, r.address));
            }

            // SafeStorage
            try {
                const cached = SafeStorage.getItem('condosphere_residences');
                if (cached) JSON.parse(cached).forEach(r => addResidence(r.identifier, r.owner, r.address));
            } catch(e) {}

            console.log('[PORTARIA SEARCH] matchingResIdents:', Array.from(matchingResIdents));

            // --- SCAN RESIDENTS ---
            const residents = [];

            function addResident(name, ident, contact, role, isAssociated) {
                residents.push({ name, ident: ident || 'Sem Vínculo', addr: 'Condomínio CondoSphere', contact: contact || '', role: role || 'Morador', isAssociated: !!isAssociated });
            }

            // DOM
            Array.from(document.querySelectorAll('#tab-moradores table tbody tr')).forEach(row => {
                const c = row.getElementsByTagName('td');
                if (c.length >= 5) {
                    const assoc = c[5] ? c[5].querySelector('input[type="checkbox"]') : null;
                    addResident(c[0].textContent.trim(), c[4].textContent.trim(), c[2]?.textContent.trim(), c[3]?.textContent.trim(), assoc ? assoc.checked : false);
                }
            });

            // window cache
            if (cachedResidentsData && Array.isArray(cachedResidentsData)) {
                cachedResidentsData.forEach(m => {
                    if (!residents.some(r => r.name === m.name)) {
                        addResident(m.name, m.residence_name, m.contact, m.role, m.is_associated);
                    }
                });
            }

            // SafeStorage
            try {
                const cached = SafeStorage.getItem('condosphere_residents');
                if (cached) {
                    JSON.parse(cached).forEach(m => {
                        if (!residents.some(r => r.name === m.name)) {
                            addResident(m.name, m.residence_name, m.contact, m.role, m.is_associated);
                        }
                    });
                }
            } catch(e) {}

            // Bind address
            residents.forEach(r => {
                const info = residencesMap[r.ident];
                if (info) r.addr = info.address;
            });

            // --- FILTER ---
            const matchedResidents = residents.filter(r => {
                const nameOk = textMatch(r.name);
                const residenceOk = matchingResIdents.has(r.ident.toLowerCase());
                const identOk = identMatch(r.ident) || textMatch(r.addr);
                return nameOk || residenceOk || identOk;
            });

            const matchedResidences = Object.keys(residencesMap).filter(k => matchingResIdents.has(k.toLowerCase()));

            console.log('[PORTARIA SEARCH] matchedResidents:', matchedResidents.length, 'matchedResidences:', matchedResidences.length);

            // --- RENDER ---
            let html = '';

            if (matchedResidents.length === 0 && matchedResidences.length > 0) {
                html += `<div style="margin-bottom:8px; font-size:0.85rem; color:var(--color-text-muted)">Residências encontradas (${matchedResidences.length}):</div>`;
                matchedResidences.forEach(id => {
                    const r = residencesMap[id];
                    html += `
                        <div style="background-color:rgba(16,185,129,0.05); border:1px solid var(--color-success); border-radius:8px; padding:16px; margin-bottom:8px">
                            <div style="font-size:1rem; font-weight:bold; color:white">${id}</div>
                            <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:4px">Proprietário: ${r.owner} | Endereço: ${r.address}</div>
                        </div>`;
                });
            }

            matchedResidents.forEach((res, i) => {
                const encName = encodeURIComponent(res.name).replace(/'/g, "%27");
                const encIdent = encodeURIComponent(res.ident).replace(/'/g, "%27");
                const encRole = encodeURIComponent(res.role).replace(/'/g, "%27");
                html += `<div style="cursor:pointer; font-family:monospace; font-size:14px; padding:8px 10px; border-radius:4px; transition:background 0.15s" onclick="selectIntercomContact(decodeURIComponent('${encName}'), decodeURIComponent('${encIdent}'), decodeURIComponent('${encRole}'))" onmouseover="this.style.background='rgba(56,189,248,0.08)'" onmouseout="this.style.background=''">
                    <div><span style="color:#38bdf8">${res.ident}</span> <span style="color:var(--color-text-muted)">|</span> <span style="color:#fbbf24">${res.role}:</span> <span style="color:white;font-weight:bold">${res.name}</span></div>
                    <div style="margin-top:2px"><span style="color:#94a3b8">${res.addr}</span> <span style="color:var(--color-text-muted)">|</span> <span style="color:#94a3b8">${res.contact || '---'}</span></div>
                </div>`;
                if (i < matchedResidents.length - 1) html += '<hr style="border:none; border-top:1px solid rgba(148,163,184,0.1); margin:2px 0">';
            });

            if (!html) {
                html = '<div style="background-color:rgba(239,68,68,0.05); border:1px dashed var(--color-danger); border-radius:8px; padding:20px; text-align:center"><p style="font-size:0.85rem; font-weight:bold; color:#f87171">Nenhum morador ou residência localizada para esta busca!</p></div>';
            }

            resultsDiv.innerHTML = html;
        }
