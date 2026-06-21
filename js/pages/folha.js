        function simulateClockIn() {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            
            const tbody = document.getElementById('table-ponto').querySelector('tbody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>Administrador Geral (Você)</strong></td>
                <td>${now.toLocaleDateString('pt-BR')}</td>
                <td>${timeStr}</td>
                <td>--:--</td>
                <td>--:--</td>
                <td>--:--</td>
                <td style="color:var(--color-success); font-weight:bold">+00:00</td>
                <td><span class="badge badge-success">Regular</span></td>
            `;
            tbody.insertBefore(row, tbody.firstChild);
            showToast(`Ponto registrado com sucesso às ${timeStr}!`, 'success');
        }


        function simulateLoadBenefits() {
            showToast("Recarga Sodexo, RioCard e Amil iniciada...", "info");
            setTimeout(() => {
                showToast("Créditos mensais liberados com sucesso para todos os funcionários!", "success");
            }, 1500);
        }

        function simulateOnboarding() {
            if (onboardingDone) {
                showToast("O onboarding do novo candidato já foi concluído!", "warning");
                return;
            }
            
            // Add a new row to the payroll table to show instant real-time synchronization!
            const tbody = document.querySelector('#tab-folha table tbody');
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>Adriano Souza (Admitido)</strong></td>
                <td>Auxiliar de Jardinagem</td>
                <td>R$ 1.950,00</td>
                <td style="color:var(--color-danger)">R$ 0,00</td>
                <td style="font-weight:700; color:white">R$ 1.950,00</td>
            `;
            tbody.appendChild(row);
            
            onboardingDone = true;
            showToast("Candidato 'Adriano Souza' admitido digitalmente! Cadastro inserido automaticamente na folha de pagamento.", "success");
        }


        function updatePortalUserView() {
            const select = document.getElementById('portal-user-select');
            const user = select.value;
            showToast(`Acessando portal como: ${user === 'reginaldo' ? 'Reginaldo Silveira' : 'Ana Maria'}`, 'info');
        }


        function submitVacationRequest(event) {
            event.preventDefault();
            const range = document.getElementById('vacation-range').value;
            showToast(`Solicitação de férias para o período "${range}" registrada e encaminhada para o administrativo!`, 'success');
            document.getElementById('vacation-range').value = '';
        }


        function uploadMedicalCert(input) {
            const file = input.files[0];
            if (file) {
                showToast(`Atestado médico "${file.name}" anexado e enviado com sucesso nos termos da LGPD!`, 'success');
                input.value = '';
            }
        }


        function openPayrollCalculatorModal(empId) {
            if (window.event) window.event.stopPropagation();
            
            document.getElementById('modal-calculadora-folha').style.display = 'flex';
            const emp = payrollDatabase[empId];
            document.getElementById('calc-emp-id').value = empId;
            document.getElementById('calc-emp-name').innerText = emp.name;
            document.getElementById('calc-ot50').value = emp.ot50;
            document.getElementById('calc-ot100').value = emp.ot100;
            document.getElementById('calc-night').value = emp.night;
            document.getElementById('calc-absences').value = emp.absences;
            
            recalculatePayrollLive();
        }


        function closePayrollCalculatorModal() {
            document.getElementById('modal-calculadora-folha').style.display = 'none';
        }


        function recalculatePayrollLive() {
            const empId = document.getElementById('calc-emp-id').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            const base = emp.base;
            const ot50Hours = parseFloat(document.getElementById('calc-ot50').value) || 0;
            const ot100Hours = parseFloat(document.getElementById('calc-ot100').value) || 0;
            const nightHours = parseFloat(document.getElementById('calc-night').value) || 0;
            const absences = parseInt(document.getElementById('calc-absences').value) || 0;

            const hourVal = base / 220;
            const ot50Val = ot50Hours * hourVal * 1.5;
            const ot100Val = ot100Hours * hourVal * 2.0;
            const nightVal = nightHours * hourVal * 0.2;
            const dsrVal = ((ot50Val + ot100Val + nightVal) / 26) * 4; 
            
            const absenceVal = absences * (base / 30);
            
            const totalBruto = base + ot50Val + ot100Val + nightVal + dsrVal - absenceVal;

            let inss = 0;
            if (totalBruto <= 1412) inss = totalBruto * 0.075;
            else if (totalBruto <= 2666.68) inss = 1412 * 0.075 + (totalBruto - 1412) * 0.09;
            else if (totalBruto <= 4000.03) inss = 1412 * 0.075 + 1254.68 * 0.09 + (totalBruto - 2666.68) * 0.12;
            else inss = 1412 * 0.075 + 1254.68 * 0.09 + 1333.35 * 0.12 + (totalBruto - 4000.03) * 0.14;

            let irrf = 0;
            const baseIrrf = totalBruto - inss;
            if (baseIrrf <= 2259.20) irrf = 0;
            else if (baseIrrf <= 2826.65) irrf = (baseIrrf * 0.075) - 169.44;
            else if (baseIrrf <= 3751.05) irrf = (baseIrrf * 0.15) - 381.44;
            else if (baseIrrf <= 4664.68) irrf = (baseIrrf * 0.225) - 662.77;
            else irrf = (baseIrrf * 0.275) - 896.00;

            const netPay = totalBruto - inss - irrf - emp.adv;

            document.getElementById('live-base-salary').innerText = `R$ ${base.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-ot-val').innerText = `+R$ ${(ot50Val + ot100Val).toFixed(2).replace('.', ',')}`;
            document.getElementById('live-night-val').innerText = `+R$ ${nightVal.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-dsr-val').innerText = `+R$ ${dsrVal.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-inss-val').innerText = `-R$ ${inss.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-irrf-val').innerText = `-R$ ${irrf.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-absences-val').innerText = `-R$ ${absenceVal.toFixed(2).replace('.', ',')}`;
            document.getElementById('live-net-pay').innerText = `R$ ${netPay.toFixed(2).replace('.', ',')}`;

            emp.tempNet = netPay;
            emp.tempOt50 = ot50Hours;
            emp.tempOt100 = ot100Hours;
            emp.tempNight = nightHours;
            emp.tempAbsences = absences;
        }


        function savePayrollCalculator(event) {
            event.preventDefault();
            const empId = document.getElementById('calc-emp-id').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            emp.net = emp.tempNet;
            emp.ot50 = emp.tempOt50;
            emp.ot100 = emp.tempOt100;
            emp.night = emp.tempNight;
            emp.absences = emp.tempAbsences;

            document.getElementById(`payroll-net-${empId}`).innerText = `R$ ${emp.net.toFixed(2).replace('.', ',')}`;
            showToast(`Cálculos da folha de ${emp.name} salvos com sucesso!`, 'success');
            closePayrollCalculatorModal();
        }


        function openTaxesModal() {
            document.getElementById('modal-impostos-guias').style.display = 'flex';
        }

        function closeTaxesModal() {
            document.getElementById('modal-impostos-guias').style.display = 'none';
        }

        function printTaxGuide(type) {
            showToast(`Gerando e enviando ordem de impressão para guia do ${type}...`, 'info');
            setTimeout(() => {
                showToast(`Guia do ${type} emitida e enviada para impressora padrão da associação!`, 'success');
            }, 1000);
        }

        function downloadPagforRemittance() {
            const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '');
            const lines = [
                `033000000000000000020100756000010014028200000000045050519965005081CONDOSPHERE ERP-MUNICIPAL     SICOOB COOPERATIVO           ${dateStr}120000000001`,
                `0330001100001A010111111111111111Reginaldo Silveira                     0330001001402820000000002300000000000000000000000000${dateStr}BRL0000000000`,
                `0330001100002A010122222222222222Ana Maria de Jesus                     0330001001402820000000001800000000000000000000000000${dateStr}BRL0000000000`,
                `033999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999999`
            ];
            const content = lines.join("\r\n");
            const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", `REMESSA_PAGFOR_SALARIOS_${dateStr}.TXT`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            showToast("Arquivo de remessa de pagamentos PAGFOR (.TXT) baixado com sucesso!");
        }


        function openRescisionModal() {
            document.getElementById('modal-rescisao-calc').style.display = 'flex';
            updateRescisionEmployeeData();
        }

        function closeRescisionModal() {
            document.getElementById('modal-rescisao-calc').style.display = 'none';
        }

        function updateRescisionEmployeeData() {
            const empId = document.getElementById('resc-emp-select').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            if (empId === 'reginaldo') {
                document.getElementById('resc-adm-date').value = "01/01/2025";
                document.getElementById('resc-signature-view').innerText = "Assinado Digitalmente por Reginaldo Silveira";
            } else {
                document.getElementById('resc-adm-date').value = "15/05/2025";
                document.getElementById('resc-signature-view').innerText = "Assinado Digitalmente por Ana Maria de Jesus";
            }
            recalculateRescisionLive();
        }

        function recalculateRescisionLive() {
            const empId = document.getElementById('resc-emp-select').value;
            const reason = document.getElementById('resc-reason').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            const base = emp.base;
            
            const saldoSalario = (base / 30) * 12; 
            const decimoTerceiro = (base / 12) * 5.5; 
            const feriasProporcionais = ((base / 12) * 5.5) * 1.33; 
            
            let fgtsMulta = 0;
            if (reason === 'sem_justa') {
                const totalSalaryPaid = (empId === 'reginaldo') ? (base * 17) : (base * 13);
                const accumulatedFgts = totalSalaryPaid * 0.08;
                fgtsMulta = accumulatedFgts * 0.40;
            }

            const totalRescisao = saldoSalario + decimoTerceiro + feriasProporcionais + fgtsMulta;

            document.getElementById('resc-salary-val').innerText = `R$ ${saldoSalario.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-13-val').innerText = `R$ ${decimoTerceiro.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-vacation-val').innerText = `R$ ${feriasProporcionais.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-fgts-val').innerText = `R$ ${fgtsMulta.toFixed(2).replace('.', ',')}`;
            document.getElementById('resc-total-val').innerText = `R$ ${totalRescisao.toFixed(2).replace('.', ',')}`;
        }

        function submitRescisionForm(event) {
            event.preventDefault();
            const empId = document.getElementById('resc-emp-select').value;
            const emp = payrollDatabase[empId];
            if (!emp) return;

            const signed = document.getElementById('resc-sig-check').checked;
            if (!signed) {
                showToast("É obrigatório confirmar a assinatura digital para homologar!", "warning");
                return;
            }

            const row = document.getElementById(`payroll-row-${empId}`);
            if (row) {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0.3';
                row.style.pointerEvents = 'none';
                row.querySelector('button').innerText = "Rescindido";
                row.querySelector('button').disabled = true;
                row.querySelector('button').style.backgroundColor = "var(--color-border)";
            }

            showToast(`Contrato de trabalho de ${emp.name} rescindido e homologado via assinatura eletrônica nos termos da lei!`, 'success');
            closeRescisionModal();
        }

        let hasClockedInToday = false;

        let onboardingDone = false;

        let payrollDatabase = {
            reginaldo: { base: 2800, adv: 500, ot50: 0, ot100: 0, night: 0, absences: 0, net: 2300, name: "Reginaldo Silveira" },
            ana: { base: 2200, adv: 400, ot50: 0, ot100: 0, night: 0, absences: 0, net: 1800, name: "Ana Maria de Jesus" }
        };
