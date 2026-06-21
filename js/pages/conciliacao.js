
        /* BANK CONCILIATION CNAB240 SIMULATION FUNCTIONS (Opção 2) */
        function downloadCnabModel() {
            const lines = [
                "000000000000000000010100756000010014028200000000045050519965005081SICOOB COOPERATIVO           SICOOB COOPERATIVO           211062026120000000210340001201",
                "0010001300001T 0000010100756000010014028200000000000000010052300000000000000010000000030000756111111111111111Carlos Henrique Silva                      30000",
                "0010001300002U 000001010075600000000000000000000000000000000000000000000030000000003000000000000000000000000000110620261106202600000000000000000000000000",
                "0010001300003T 0000010100756000010014028200000000000000010052400000000000000010000000050000756222222222222222Mariana Souza Oliveira                     50000",
                "0010001300004U 000001010075600000000000000000000000000000000000000000000050000000005000000000000000000000000000110620261106202600000000000000000000000000",
                "0010001300005T 0000010100756000010014028200000000000000010052500000000000000010000000085000756333333333333333Coral Tintas Ltda                            85000",
                "0010001300006U 000001010075600000000000000000000000000000000000000000000085000000008500000000000000000000000000011062026110620260000000000000000000000000",
                "99999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999"
            ];
            const content = lines.join("\r\n");
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "COBRANCA_RETORNO_SICOOB_CNAB240.RET");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Modelo CNAB240 Sicoob (.RET) baixado com sucesso!");
        }


        function importCnabFile(fileInput) {
            const file = fileInput.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const text = e.target.result;
                    const lines = text.split(/\r?\n/);
                    let matchedCount = 0;
                    let totalVal = 0;
                    
                    const listContainer = document.getElementById('cnab-conciliation-list');
                    listContainer.innerHTML = ''; // Reset list
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i];
                        if (line.length >= 240 && line.substring(13, 14) === 'T') {
                            const segmentT = line;
                            const segmentU = lines[i+1] && lines[i+1].substring(13, 14) === 'U' ? lines[i+1] : null;
                            
                            const nossoNumero = segmentT.substring(37, 47).trim().replace(/^0+/, '');
                            const name = segmentT.substring(143, 183).trim();
                            
                            let valuePaid = 0;
                            if (segmentU) {
                                const valPaidStr = segmentU.substring(77, 92).trim();
                                valuePaid = parseFloat(valPaidStr) / 100;
                            } else {
                                const valStr = segmentT.substring(133, 143).trim();
                                valuePaid = parseFloat(valStr) / 100;
                            }
                            
                            if (!isNaN(valuePaid) && valuePaid > 0) {
                                totalVal += valuePaid;
                                matchedCount++;
                                
                                const div = document.createElement('div');
                                div.className = 'cnab-item-row';
                                div.style.cssText = "background-color:rgba(16, 185, 129, 0.04); border:1px solid var(--color-success); padding:12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center; margin-bottom:10px";
                                div.innerHTML = `
                                    <div>
                                        <p style="font-size:0.75rem; font-weight:bold; color:white">Título Identificado no Retorno Bancário</p>
                                        <p style="font-size:0.65rem; color:var(--color-text-muted)">Nosso Número: ${nossoNumero || 'S/N'} | Sacado/Credor: ${name} | Tipo: Boleta Sicoob</p>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:10px">
                                        <span style="font-size:0.7rem; font-weight:bold; color:var(--color-success)">R$ ${valuePaid.toFixed(2).replace('.', ',')}</span>
                                        <button class="btn btn-success" style="font-size:0.65rem; padding:4px 8px" onclick="reconcileCnabItem(this, '${name}', ${valuePaid})">100% Match - Conciliar</button>
                                    </div>
                                `;
                                listContainer.appendChild(div);
                            }
                        }
                    }
                    
                    if (matchedCount > 0) {
                        document.getElementById('cnab-match-rate').innerText = "100%";
                        document.getElementById('cnab-matched-count').innerText = `${matchedCount} / ${matchedCount}`;
                        document.getElementById('cnab-processed-value').innerText = `R$ ${totalVal.toFixed(2).replace('.', ',')}`;
                        showToast(`${matchedCount} lançamentos CNAB240 importados com sucesso!`, 'success');
                    } else {
                        showToast("Nenhum lançamento válido encontrado no arquivo CNAB240.", "warning");
                    }
                } catch(err) {
                    console.error(err);
                    showToast("Erro ao decodificar arquivo CNAB240.", "error");
                }
            };
            reader.readAsText(file);
            fileInput.value = ''; // Reset selection
        }


        function reconcileCnabItem(button, name, value) {
            button.disabled = true;
            button.innerText = "Conciliado ✓";
            button.style.backgroundColor = "var(--color-border)";
            button.style.borderColor = "var(--color-border)";
            showToast(`Lançamento de ${name} (R$ ${value.toFixed(2).replace('.', ',')}) conciliado com sucesso no Caixa!`, 'success');
        }
