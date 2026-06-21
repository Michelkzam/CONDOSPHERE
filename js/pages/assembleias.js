        function openAssemblyModal() {
            document.getElementById('modal-assembly').style.display = 'flex';
            document.getElementById('as-title').value = "";
            document.getElementById('as-theme').value = "";
            document.getElementById('as-start').value = new Date().toISOString().split('T')[0];
            
            // Set end date to +10 days
            const end = new Date();
            end.setDate(end.getDate() + 10);
            document.getElementById('as-end').value = end.toISOString().split('T')[0];
            
            document.getElementById('as-p1-title').value = "";
            document.getElementById('as-p1-desc').value = "";
            document.getElementById('as-p2-title').value = "";
            document.getElementById('as-p2-desc').value = "";
        }


        function closeAssemblyModal() {
            document.getElementById('modal-assembly').style.display = 'none';
        }


        function submitAssemblyForm(event) {
            event.preventDefault();
            try {
                const title = document.getElementById('as-title').value;
                const theme = document.getElementById('as-theme').value;
                const startDate = document.getElementById('as-start').value;
                const endDate = document.getElementById('as-end').value;
                
                const p1Title = document.getElementById('as-p1-title').value;
                const p1Desc = document.getElementById('as-p1-desc').value;
                
                const p2Title = document.getElementById('as-p2-title').value;
                const p2Desc = document.getElementById('as-p2-desc').value;

                const proposals = [
                    { id: 1, title: p1Title, description: p1Desc, yes_votes: 0, no_votes: 0 }
                ];

                if (p2Title && p2Desc) {
                    proposals.push({ id: 2, title: p2Title, description: p2Desc, yes_votes: 0, no_votes: 0 });
                }

                const newId = 'as-' + Math.floor(Math.random() * 100000);
                const newAssembly = {
                    id: newId,
                    title,
                    theme,
                    start_date: startDate,
                    end_date: endDate,
                    proposals
                };

                assembliesList.push(newAssembly);
                saveLocalAssembliesToCache();
                renderAssemblies();
                closeAssemblyModal();
                showToast("Nova assembleia geral virtual aberta para votação!");

                // Sync with Supabase cloud
                if (supabaseClient) {
                    const insertPayload = {
                        title,
                        theme,
                        start_date: startDate,
                        end_date: endDate,
                        proposals
                    };
                    Promise.resolve(dbClient.from('assemblies').insert([insertPayload])).catch(() => {});
                }
            } catch (err) {
                console.error("Error submitting assembly form:", err);
                showToast("Erro ao lançar assembleia!", "error");
            }
        }


        function deleteAssembly(id) {
            if (confirm("Tem certeza que deseja cancelar esta votação e excluir a assembleia do sistema?")) {
                assembliesList = assembliesList.filter(a => String(a.id) !== String(id));
                saveLocalAssembliesToCache();
                renderAssemblies();
                showToast("Assembleia cancelada e excluída.");

                if (supabaseClient && !String(id).startsWith('as-')) {
                    dbClient.from('assemblies').delete().eq('id', id).catch(() => {});
                }
            }
        }


        function saveLocalAssembliesToCache() {
            SafeStorage.setItem('condosphere_assemblies', JSON.stringify(assembliesList));
        }


        function renderAssemblies() {
            const container = document.getElementById('assemblies-list-container');
            if (!container) return;
            container.innerHTML = '';

            if (assembliesList.length === 0) {
                container.innerHTML = `<div style="text-align:center; color:var(--color-text-muted); padding:30px; font-size:0.75rem; border:1px dashed var(--color-border); border-radius:8px">
                    🗳️ Nenhuma assembleia virtual aberta ou pauta em votação cadastrada neste momento.
                </div>`;
                return;
            }

            assembliesList.forEach(as => {
                const today = new Date().toISOString().split('T')[0];
                const isActive = today >= as.start_date && today <= as.end_date;
                const statusBadge = isActive ? '<span class="badge badge-success">Em Andamento</span>' : '<span class="badge badge-secondary">Finalizada</span>';
                
                const startParts = as.start_date.split('-');
                const endParts = as.end_date.split('-');
                const formattedPeriod = `${startParts[2]}/${startParts[1]}/${startParts[0]} a ${endParts[2]}/${endParts[1]}/${endParts[0]}`;

                const card = document.createElement('div');
                card.className = "panel-card";
                card.style.backgroundColor = "rgba(255,255,255,0.01)";
                card.style.border = "1px solid var(--color-border)";
                card.style.borderRadius = "12px";
                card.style.padding = "20px";
                card.style.marginBottom = "15px";

                let proposalsHTML = '';
                as.proposals.forEach(p => {
                    const totalVotes = p.yes_votes + p.no_votes;
                    const yesPct = totalVotes > 0 ? Math.round((p.yes_votes / totalVotes) * 100) : 0;
                    const noPct = totalVotes > 0 ? Math.round((p.no_votes / totalVotes) * 100) : 0;

                    const disabledAttr = isActive ? "" : "disabled";

                    proposalsHTML += `
                            <!-- Proposal ${p.id} -->
                            <div style="background-color:rgba(255,255,255,0.02); border:1px solid var(--color-border); padding:20px; border-radius:12px; display:flex; flex-direction:column; justify-content:space-between">
                                <div>
                                    <span style="font-size:0.65rem; background:rgba(96,165,250,0.1); color:#60a5fa; padding:2px 8px; border-radius:4px; font-weight:bold; text-transform:uppercase">Pauta #0${p.id}</span>
                                    <h4 style="font-size:0.9rem; font-weight:bold; margin-top:8px; margin-bottom:6px; color:white">${p.title}</h4>
                                    <p style="font-size:0.72rem; color:var(--color-text-muted); line-height:1.4">${p.description}</p>
                                </div>
                                <div style="margin-top:20px">
                                    <!-- Results Progress -->
                                    <div style="margin-bottom:16px">
                                        <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:bold; margin-bottom:4px">
                                            <span>Sim: ${p.yes_votes} votos</span>
                                            <span>${yesPct}%</span>
                                        </div>
                                        <div style="width:100%; height:8px; background:var(--color-border); border-radius:4px; overflow:hidden; margin-bottom:12px">
                                            <div style="width:${yesPct}%; height:100%; background:var(--color-success); transition:width 0.5s ease"></div>
                                        </div>

                                        <div style="display:flex; justify-content:space-between; font-size:0.7rem; font-weight:bold; margin-bottom:4px">
                                            <span>Não: ${p.no_votes} votos</span>
                                            <span>${noPct}%</span>
                                        </div>
                                        <div style="width:100%; height:8px; background:var(--color-border); border-radius:4px; overflow:hidden">
                                            <div style="width:${noPct}%; height:100%; background:var(--color-danger); transition:width 0.5s ease"></div>
                                        </div>
                                    </div>
                                    <!-- Action Buttons -->
                                    <div style="display:flex; gap:10px">
                                        <button class="btn btn-success" style="flex:1; font-size:0.7rem; padding:8px" onclick="castAssemblyVote('${as.id}', ${p.id}, 'yes')" ${disabledAttr}>Votar SIM</button>
                                        <button class="btn btn-danger" style="flex:1; font-size:0.7rem; padding:8px" onclick="castAssemblyVote('${as.id}', ${p.id}, 'no')" ${disabledAttr}>Votar NÃO</button>
                                    </div>
                                </div>
                            </div>
                    `;
                });

                card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--color-border); padding-bottom:14px; margin-bottom:20px; flex-wrap:wrap; gap:10px">
                            <div>
                                <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px">
                                    ${statusBadge}
                                    <h3 class="panel-title">${as.title}</h3>
                                </div>
                                <p class="panel-subtitle">Tema: ${as.theme}</p>
                            </div>
                            <div style="text-align:right; display:flex; flex-direction:column; align-items:flex-end; gap:8px">
                                <div>
                                    <p style="font-size:0.7rem; color:var(--color-text-muted)">Período de Votação:</p>
                                    <p style="font-size:0.75rem; font-weight:bold; color:white">${formattedPeriod}</p>
                                </div>
                                <button class="btn btn-secondary" onclick="deleteAssembly('${as.id}')" style="font-size:0.6rem; padding:4px 8px; color:var(--color-danger); border-color:rgba(239,68,68,0.2)">✕ Excluir</button>
                            </div>
                        </div>

                        <!-- Topics in Voting (Pautas) Grid -->
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:20px">
                            ${proposalsHTML}
                        </div>
                        </div>
                `;

                container.appendChild(card);
            });
        }

        let assembliesList = [];
