const REPORT_SUPABASE_URL = 'https://psbvjscrqhwhttvbstty.supabase.co';
const REPORT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYnZqc2NycWh3aHR0dmJzdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTA4MzAsImV4cCI6MjA5Njg2NjgzMH0.AFnX7TYKrpTSQMBEU9Rwj0g8nvgpSEDKSjGNb-FM2Gw';

async function reportSupabaseQuery(table, select, filters) {
    select = select || '*';
    filters = filters || {};
    let url = REPORT_SUPABASE_URL + '/rest/v1/' + table + '?select=' + select;
    for (const [key, value] of Object.entries(filters)) {
        url += '&' + key + '=eq.' + encodeURIComponent(value);
    }
    const res = await fetch(url, { headers: { 'apikey': REPORT_SUPABASE_KEY, 'Authorization': 'Bearer ' + REPORT_SUPABASE_KEY } });
    return await res.json();
}

async function generateBalance() {
    const receivables = await reportSupabaseQuery('receivables', '*');
    const payables = await reportSupabaseQuery('payables', '*');
    const totalReceitas = receivables.filter(r => r.status === 'Pago').reduce((s, r) => s + r.base_value, 0);
    const totalDespesas = payables.filter(p => p.status === 'Pago').reduce((s, p) => s + p.value, 0);
    const saldo = totalReceitas - totalDespesas;
    document.getElementById('bal-receitas').innerText = 'R$ ' + totalReceitas.toFixed(2).replace('.', ',');
    document.getElementById('bal-despesas').innerText = 'R$ ' + totalDespesas.toFixed(2).replace('.', ',');
    document.getElementById('bal-saldo').innerText = 'R$ ' + saldo.toFixed(2).replace('.', ',');
    document.getElementById('bal-saldo').style.color = saldo >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    document.getElementById('balance-result').style.display = 'block';
}

async function generateDRE() {
    const receivables = await reportSupabaseQuery('receivables', '*');
    const payables = await reportSupabaseQuery('payables', '*');
    const employees = await reportSupabaseQuery('employees', '*');
    const bruta = receivables.filter(r => r.status === 'Pago').reduce((s, r) => s + r.base_value, 0);
    const liquida = bruta * 0.95;
    const folha = employees.reduce((s, e) => s + (e.salary || 0), 0);
    const superavit = liquida - folha - payables.filter(p => p.status === 'Pago').reduce((s, p) => s + p.value, 0);
    document.getElementById('dre-bruta').innerText = 'R$ ' + bruta.toFixed(2).replace('.', ',');
    document.getElementById('dre-liquida').innerText = 'R$ ' + liquida.toFixed(2).replace('.', ',');
    document.getElementById('dre-folha').innerText = 'R$ ' + folha.toFixed(2).replace('.', ',');
    document.getElementById('dre-superavit').innerText = 'R$ ' + superavit.toFixed(2).replace('.', ',');
    document.getElementById('dre-superavit').style.color = superavit >= 0 ? 'var(--color-success)' : 'var(--color-danger)';
    document.getElementById('dre-result').style.display = 'block';
}

async function generateTaxGuides() {
    const employees = await reportSupabaseQuery('employees', '*');
    const gps = window.TaxGuides.generateGPS(employees, 6, 2026);
    const darf = window.TaxGuides.generateDARF(employees, 6, 2026);
    const grf = window.TaxGuides.generateGRF(employees, 6, 2026);
    document.getElementById('guide-gps').innerText = 'R$ ' + gps.totalINSS.toFixed(2).replace('.', ',');
    document.getElementById('guide-darf').innerText = 'R$ ' + darf.totalIRRF.toFixed(2).replace('.', ',');
    document.getElementById('guide-grf').innerText = 'R$ ' + grf.totalFGTS.toFixed(2).replace('.', ',');
    document.getElementById('tax-guides-result').style.display = 'block';
}

async function generatePayslips() {
    const employees = await reportSupabaseQuery('employees', '*');
    const container = document.getElementById('payslips-result');
    if (employees.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--color-text-muted); padding:20px">Nenhum funcionário encontrado</p>';
        return;
    }
    container.innerHTML = employees.map(emp => {
        const inss = window.CondoFinance.calculateEmployeeINSS(emp.salary || 0);
        const fgts = window.CondoFinance.calculateFGTS(emp.salary || 0);
        const irrf = window.CondoFinance.calculateIRRF(emp.salary || 0, inss);
        const liquido = emp.salary - inss - irrf;
        return '<div class="report-item"><h3>' + emp.name + '</h3><p>' + emp.role + ' | CPF: ' + (emp.cpf || '-') + '</p><div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:11px"><div><span style="color:var(--color-text-muted)">Salário Base:</span> <strong style="color:white">R$ ' + (emp.salary||0).toFixed(2) + '</strong></div><div><span style="color:var(--color-text-muted)">INSS:</span> <strong style="color:var(--color-danger)">-R$ ' + inss.toFixed(2) + '</strong></div><div><span style="color:var(--color-text-muted)">FGTS:</span> <strong style="color:var(--color-warning)">R$ ' + fgts.toFixed(2) + '</strong></div><div><span style="color:var(--color-text-muted)">IRRF:</span> <strong style="color:var(--color-danger)">-R$ ' + irrf.toFixed(2) + '</strong></div></div><div style="margin-top:8px; padding-top:8px; border-top:1px solid var(--color-border); display:flex; justify-content:space-between"><span style="font-size:12px; font-weight:700; color:var(--color-success)">Líquido: R$ ' + liquido.toFixed(2) + '</span><button class="btn btn-secondary btn-sm" onclick="printPayslip(\'' + emp.name + '\',\'' + emp.role + '\',' + (emp.salary||0) + ',' + inss + ',' + irrf + ',' + liquido + ')">Imprimir</button></div></div>';
    }).join('');
}

function printPayslip(name, role, salary, inss, irrf, net) {
    const w = window.open('', '_blank');
    w.document.write('<!DOCTYPE html><html><head><title>Holerite - ' + name + '</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Courier New",monospace;font-size:11px;color:#000;padding:30px}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin:10px 0}td{padding:4px 8px}.total{font-weight:bold;border-top:2px solid #000;padding-top:8px;margin-top:10px}</style></head><body><div class="header"><h2>COMPROVANTE DE REMUNERAÇÃO</h2><h3>CondoSphere ERP</h3></div><p><strong>Colaborador:</strong> ' + name + '</p><p><strong>Cargo:</strong> ' + role + '</p><p><strong>Competência:</strong> Junho/2026</p><table><tr><td>Salário Base:</td><td>R$ ' + salary.toFixed(2) + '</td></tr><tr><td>(-) INSS:</td><td>R$ ' + inss.toFixed(2) + '</td></tr><tr><td>(-) IRRF:</td><td>R$ ' + irrf.toFixed(2) + '</td></tr><tr class="total"><td><strong>LÍQUIDO:</strong></td><td><strong>R$ ' + net.toFixed(2) + '</strong></td></tr></table><p style="margin-top:20px;font-size:9px;color:#888">Documento gerado eletronicamente pelo CondoSphere ERP</p></body></html>');
    w.document.close();
    w.focus();
    setTimeout(function() { w.print(); }, 500);
}

async function generateBalancetePDF() {
    await generateBalance();
    const w = window.open('', '_blank');
    const receitas = document.getElementById('bal-receitas').innerText;
    const despesas = document.getElementById('bal-despesas').innerText;
    const saldo = document.getElementById('bal-saldo').innerText;
    w.document.write('<!DOCTYPE html><html><head><title>Balancete</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:"Courier New",monospace;font-size:11px;color:#000;padding:30px}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin:10px 0}td{padding:6px 8px}</style></head><body><div class="header"><h2>BALANCETE MENSAL</h2><h3>CondoSphere ERP</h3></div><table><tr><td><strong>Receitas:</strong></td><td>' + receitas + '</td></tr><tr><td><strong>Despesas:</strong></td><td>' + despesas + '</td></tr><tr style="border-top:2px solid #000"><td><strong>Saldo:</strong></td><td><strong>' + saldo + '</strong></td></tr></table><p style="margin-top:20px;font-size:9px;color:#888">Documento gerado eletronicamente</p></body></html>');
    w.document.close();
    w.focus();
    setTimeout(function() { w.print(); }, 500);
}
