/* =====================================================================
   CONDOSPHERE - Gerador de Relatórios PDF (pdf-reports.js)
   Gera relatórios profissionais em PDF usando jsPDF
   ===================================================================== */

// === PDF REPORT GENERATOR ===
const PDFReport = {
    // Generate a standard header for all reports
    addHeader: function(doc, title, subtitle) {
        // Header background
        doc.setFillColor(20, 28, 46);
        doc.rect(0, 0, 210, 35, 'F');
        
        // Logo circle
        doc.setFillColor(59, 130, 246);
        doc.circle(20, 17.5, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('CS', 20, 19, { align: 'center' });
        
        // Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('CondoSphere ERP', 35, 14);
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(title || 'Relatório', 35, 21);
        
        doc.setFontSize(8);
        doc.setTextColor(150, 160, 180);
        doc.text(subtitle || 'Documento gerado automaticamente', 35, 27);
        
        // Date
        doc.setTextColor(150, 160, 180);
        doc.setFontSize(8);
        doc.text('Data: ' + new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR'), 190, 14, { align: 'right' });
        
        return 40; // Return Y position after header
    },
    
    // Add a table to the PDF
    addTable: function(doc, startY, headers, rows, options) {
        options = options || {};
        var colWidths = options.colWidths || [];
        var colAligns = options.colAligns || [];
        
        // Auto-calculate column widths if not provided
        if (colWidths.length === 0) {
            var pageWidth = 190; // A4 width minus margins
            colWidths = headers.map(function() { return pageWidth / headers.length; });
        }
        
        var currentY = startY;
        var lineHeight = 6;
        
        // Header row
        doc.setFillColor(30, 45, 74);
        doc.rect(10, currentY - 4, 190, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.setFont(undefined, 'bold');
        
        var xPos = 10;
        headers.forEach(function(header, i) {
            doc.text(header, xPos + 2, currentY);
            xPos += colWidths[i];
        });
        
        currentY += 8;
        
        // Data rows
        doc.setTextColor(40, 40, 40);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(7);
        
        rows.forEach(function(row, rowIndex) {
            // Check if we need a new page
            if (currentY > 270) {
                doc.addPage();
                currentY = 20;
                
                // Re-add header on new page
                doc.setFillColor(30, 45, 74);
                doc.rect(10, currentY - 4, 190, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(7);
                doc.setFont(undefined, 'bold');
                xPos = 10;
                headers.forEach(function(header, i) {
                    doc.text(header, xPos + 2, currentY);
                    xPos += colWidths[i];
                });
                currentY += 8;
                doc.setTextColor(40, 40, 40);
                doc.setFont(undefined, 'normal');
                doc.setFontSize(7);
            }
            
            // Alternating row background
            if (rowIndex % 2 === 0) {
                doc.setFillColor(248, 249, 250);
                doc.rect(10, currentY - 4, 190, lineHeight, 'F');
            }
            
            var xPos = 10;
            row.forEach(function(cell, i) {
                var align = colAligns[i] || 'left';
                doc.text(String(cell || '-'), xPos + 2, currentY);
                xPos += colWidths[i];
            });
            
            currentY += lineHeight;
        });
        
        return currentY;
    },
    
    // Add footer
    addFooter: function(doc, pageCount) {
        var totalPages = doc.internal.getNumberOfPages();
        for (var i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFillColor(20, 28, 46);
            doc.rect(0, 285, 210, 12, 'F');
            doc.setTextColor(150, 160, 180);
            doc.setFontSize(7);
            doc.text('CondoSphere ERP - Documento gerado eletronicamente', 10, 292);
            doc.text('Página ' + i + ' de ' + totalPages, 200, 292, { align: 'right' });
        }
    },
    
    // Add summary box
    addSummaryBox: function(doc, y, items) {
        doc.setFillColor(240, 245, 255);
        doc.roundedRect(10, y, 190, items.length * 7 + 10, 3, 3, 'F');
        
        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('Resumo', 15, y + 7);
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(60, 60, 60);
        
        var summaryY = y + 14;
        items.forEach(function(item) {
            doc.text(item.label + ':', 15, summaryY);
            doc.setFont(undefined, 'bold');
            doc.text(item.value, 80, summaryY);
            doc.setFont(undefined, 'normal');
            summaryY += 7;
        });
        
        return summaryY + 5;
    }
};

// =====================================================================
// REPORT GENERATORS
// =====================================================================

function generateResidenciasPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Residências', 'Cadastro completo de unidades habitacionais');
    
    // Summary
    var totalValue = residencesList.reduce(function(sum, r) { return sum + (r.base_value || 0); }, 0);
    var activeCount = residencesList.filter(function(r) { return r.status === 'Ativo'; }).length;
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total de Residências', value: String(residencesList.length) },
        { label: 'Ativas', value: String(activeCount) },
        { label: 'Valor Total Mensal', value: 'R$ ' + totalValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
    ]);
    
    // Table
    if (residencesList.length > 0) {
        var headers = ['Identificador', 'Proprietário', 'Endereço', 'Valor Base', 'Status'];
        var rows = residencesList.map(function(r) {
            return [r.identifier, r.owner, r.address, 'R$ ' + (r.base_value || 0).toFixed(2), r.status];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [40, 45, 50, 30, 25],
            colAligns: ['left', 'left', 'left', 'right', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhuma residência cadastrada.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_residencias_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Residências gerado com sucesso!');
}

function generateMoradoresPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Moradores', 'Cadastro completo de associados e moradores');
    
    var associatedCount = residentsList.filter(function(r) { return r.is_associated; }).length;
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total de Moradores', value: String(residentsList.length) },
        { label: 'Associados', value: String(associatedCount) },
        { label: 'Não Associados', value: String(residentsList.length - associatedCount) }
    ]);
    
    if (residentsList.length > 0) {
        var headers = ['Nome', 'CPF', 'Contato', 'Função', 'Residência', 'Status'];
        var rows = residentsList.map(function(r) {
            return [r.name, r.cpf, r.contact, r.role, r.residence_name, r.status || 'Ativo'];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [35, 25, 30, 25, 40, 25],
            colAligns: ['left', 'center', 'left', 'left', 'left', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhum morador cadastrado.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_moradores_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Moradores gerado com sucesso!');
}

function generateVeiculosPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Veículos', 'Frota cadastrada no condomínio');
    
    var activeCount = vehiclesList.filter(function(v) { return v.is_active !== false; }).length;
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total de Veículos', value: String(vehiclesList.length) },
        { label: 'Ativos', value: String(activeCount) }
    ]);
    
    if (vehiclesList.length > 0) {
        var headers = ['Placa', 'Marca/Modelo', 'Cor', 'Proprietário', 'Status'];
        var rows = vehiclesList.map(function(v) {
            return [v.plate, v.model, v.color, v.owner_name, v.is_active !== false ? 'Ativo' : 'Inativo'];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [30, 40, 30, 50, 30],
            colAligns: ['center', 'left', 'left', 'left', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhum veículo cadastrado.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_veiculos_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Veículos gerado com sucesso!');
}

function generateFuncionariosPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Funcionários', 'Cadastro de colaboradores CLT');
    
    var totalSalary = employeesList.reduce(function(sum, e) { return sum + (e.salary || 0); }, 0);
    var totalAdvance = employeesList.reduce(function(sum, e) { return sum + (e.advance || 0); }, 0);
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total de Funcionários', value: String(employeesList.length) },
        { label: 'Folha Salarial Total', value: 'R$ ' + totalSalary.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
        { label: 'Adiantamentos Pendentes', value: 'R$ ' + totalAdvance.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
    ]);
    
    if (employeesList.length > 0) {
        var headers = ['Funcionário', 'CPF', 'Cargo', 'Salário', 'Admissão', 'Status'];
        var rows = employeesList.map(function(e) {
            return [e.name, e.cpf, e.role, 'R$ ' + (e.salary || 0).toFixed(2), e.admission_date, e.is_active !== false ? 'Ativo' : 'Inativo'];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [35, 25, 35, 30, 30, 25],
            colAligns: ['left', 'center', 'left', 'right', 'center', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhum funcionário cadastrado.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_funcionarios_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Funcionários gerado com sucesso!');
}

function generateContasPagarPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Contas a Pagar', 'Extrato de despesas e obrigação financeira');
    
    var totalPending = payablesList.filter(function(p) { return p.status === 'Pendente'; }).reduce(function(sum, p) { return sum + p.value; }, 0);
    var totalPaid = payablesList.filter(function(p) { return p.status === 'Pago'; }).reduce(function(sum, p) { return sum + p.value; }, 0);
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total de Despesas', value: String(payablesList.length) },
        { label: 'Pendente', value: 'R$ ' + totalPending.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
        { label: 'Pago', value: 'R$ ' + totalPaid.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
    ]);
    
    if (payablesList.length > 0) {
        var headers = ['Código', 'Fornecedor', 'Descrição', 'Vencimento', 'Valor', 'Status'];
        var rows = payablesList.map(function(p) {
            return ['#' + String(p.id).padStart(3, '0'), p.creditor, p.description, p.dueDate, 'R$ ' + p.value.toFixed(2), p.status];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [18, 35, 45, 30, 30, 25],
            colAligns: ['center', 'left', 'left', 'center', 'right', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhuma despesa cadastrada.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_contas_pagar_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Contas a Pagar gerado com sucesso!');
}

function generateContasReceberPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Contas a Receber', 'Inadimplência e faturamento condominial');
    
    if (receivablesList.length > 0) {
        var totalPending = receivablesList.filter(function(r) { return r.status !== 'Pago'; }).reduce(function(sum, r) { return sum + r.baseValue; }, 0);
        var totalPaid = receivablesList.filter(function(r) { return r.status === 'Pago'; }).reduce(function(sum, r) { return sum + r.baseValue; }, 0);
        
        y = PDFReport.addSummaryBox(doc, y, [
            { label: 'Total de Lançamentos', value: String(receivablesList.length) },
            { label: 'Recebido', value: 'R$ ' + totalPaid.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
            { label: 'Pendente', value: 'R$ ' + totalPending.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
        ]);
        
        var headers = ['Unidade', 'Proprietário', 'Vencimento', 'Dias Atraso', 'Valor', 'Status'];
        var rows = receivablesList.map(function(r) {
            return [r.identifier, r.owner, r.dueDate, r.delayDays > 0 ? r.delayDays + ' dias' : '-', 'R$ ' + r.baseValue.toFixed(2), r.status];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [35, 35, 30, 25, 30, 25],
            colAligns: ['left', 'left', 'center', 'center', 'right', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhum lançamento de recebíveis.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_contas_receber_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Contas a Receber gerado com sucesso!');
}

function generatePrestadoresPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Prestadores de Serviço', 'Contratos de empresas terceirizadas');
    
    var totalContracts = prestadoresList.reduce(function(sum, p) { return sum + (p.contract_value || 0); }, 0);
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total de Prestadores', value: String(prestadoresList.length) },
        { label: 'Valor Total Contratos', value: 'R$ ' + totalContracts.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
    ]);
    
    if (prestadoresList.length > 0) {
        var headers = ['Empresa', 'CNPJ', 'Serviço', 'Valor Contrato', 'Status'];
        var rows = prestadoresList.map(function(p) {
            return [p.company, p.cnpj, p.service, 'R$ ' + (p.contract_value || 0).toFixed(2), p.status];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [40, 30, 40, 35, 25],
            colAligns: ['left', 'center', 'left', 'right', 'center']
        });
    } else {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(10);
        doc.text('Nenhum prestador cadastrado.', 105, y + 10, { align: 'center' });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_prestadores_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF de Prestadores gerado com sucesso!');
}

function generateBalancetePDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Balancete Mensal', 'Prestação de contas consolidada');
    
    var totalReceitas = receivablesList.filter(function(r) { return r.status === 'Pago'; }).reduce(function(sum, r) { return sum + r.baseValue; }, 0);
    var totalDespesas = payablesList.filter(function(p) { return p.status === 'Pago'; }).reduce(function(sum, p) { return sum + p.value; }, 0);
    var saldo = totalReceitas - totalDespesas;
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Receitas Liquidadas', value: 'R$ ' + totalReceitas.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
        { label: 'Despesas Pagas', value: 'R$ ' + totalDespesas.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
        { label: 'Saldo do Período', value: 'R$ ' + saldo.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
    ]);
    
    // Balance summary table
    var headers = ['Categoria', 'Entradas', 'Saídas', 'Saldo'];
    var rows = [
        ['Receitas de Cotas', 'R$ ' + totalReceitas.toFixed(2), '-', 'R$ ' + totalReceitas.toFixed(2)],
        ['Despesas Operacionais', '-', 'R$ ' + totalDespesas.toFixed(2), '-R$ ' + totalDespesas.toFixed(2)],
        ['SALDO CONSOLIDADO', '', '', 'R$ ' + saldo.toFixed(2)]
    ];
    
    y = PDFReport.addTable(doc, y, headers, rows, {
        colWidths: [50, 40, 40, 40],
        colAligns: ['left', 'right', 'right', 'right']
    });
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_balancete_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF do Balancete gerado com sucesso!');
}

function generateFolhaPagamentoPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório de Folha de Pagamento', 'DP & Recolhimentos CLT');
    
    var totalSalary = employeesList.reduce(function(sum, e) { return sum + (e.salary || 0); }, 0);
    var totalINSS = totalSalary * 0.11;
    var totalFGTS = totalSalary * 0.08;
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Total Funcionários', value: String(employeesList.length) },
        { label: 'Folha Bruta', value: 'R$ ' + totalSalary.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
        { label: 'INSS (11%)', value: 'R$ ' + totalINSS.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') },
        { label: 'FGTS (8%)', value: 'R$ ' + totalFGTS.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.') }
    ]);
    
    if (employeesList.length > 0) {
        var headers = ['Funcionário', 'Cargo', 'Salário Base', 'INSS (11%)', 'Líquido Estimado'];
        var rows = employeesList.map(function(e) {
            var sal = e.salary || 0;
            var inss = sal * 0.11;
            var liquido = sal - inss;
            return [e.name, e.role, 'R$ ' + sal.toFixed(2), 'R$ ' + inss.toFixed(2), 'R$ ' + liquido.toFixed(2)];
        });
        y = PDFReport.addTable(doc, y, headers, rows, {
            colWidths: [40, 35, 35, 35, 35],
            colAligns: ['left', 'left', 'right', 'right', 'right']
        });
    }
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_folha_pagamento_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('PDF da Folha de Pagamento gerado com sucesso!');
}

function generateGeralPDF() {
    var doc = new jspdf.jsPDF();
    var y = PDFReport.addHeader(doc, 'Relatório Geral do Sistema', 'Consolidado completo de todos os módulos');
    
    y = PDFReport.addSummaryBox(doc, y, [
        { label: 'Residências Cadastradas', value: String(residencesList.length) },
        { label: 'Moradores Cadastrados', value: String(residentsList.length) },
        { label: 'Veículos na Frota', value: String(vehiclesList.length) },
        { label: 'Funcionários Ativos', value: String(employeesList.length) },
        { label: 'Despesas Cadastradas', value: String(payablesList.length) },
        { label: 'Prestadores Contratados', value: String(prestadoresList.length) }
    ]);
    
    // Financial summary
    var totalReceitas = receivablesList.filter(function(r) { return r.status === 'Pago'; }).reduce(function(sum, r) { return sum + r.baseValue; }, 0);
    var totalDespesas = payablesList.reduce(function(sum, p) { return sum + p.value; }, 0);
    var totalFolha = employeesList.reduce(function(sum, e) { return sum + (e.salary || 0); }, 0);
    
    y += 5;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text('Resumo Financeiro', 10, y);
    y += 8;
    
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('Receitas Recebidas: R$ ' + totalReceitas.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), 15, y); y += 6;
    doc.text('Despesas Totais: R$ ' + totalDespesas.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), 15, y); y += 6;
    doc.text('Folha Salarial: R$ ' + totalFolha.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), 15, y); y += 6;
    doc.setFont(undefined, 'bold');
    doc.text('Saldo: R$ ' + (totalReceitas - totalDespesas - totalFolha).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'), 15, y);
    
    PDFReport.addFooter(doc);
    doc.save('condosphere_relatorio_geral_' + new Date().toISOString().split('T')[0] + '.pdf');
    showToast('Relatório Geral PDF gerado com sucesso!');
}
