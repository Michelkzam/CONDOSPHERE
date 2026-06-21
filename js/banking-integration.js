/* =====================================================================
   CONDOSPHERE - Integração Bancária Real
   PIX, Boleto, CNAB240/400
   ===================================================================== */

const BankingIntegration = {
    // Configurações do Sicoob (Cooperativa)
    config: {
        bank_code: '756',
        agency: '0001',
        account: '123456-7',
        cooperativa: 'Sicoob',
        cnpj: '12.345.678/0001-90',
        convenio: '0000000',
        carteira: '09'
    },

    // =====================================================================
    // GERAÇÃO DE BOLETO BANCÁRIO
    // =====================================================================
    generateBoleto(amount, dueDate, payer, description, ourNumber) {
        const today = new Date();
        const due = new Date(dueDate);
        
        // Calcular linha digitável (simulação)
        const barcode = this.generateBarcode(amount, due);
        const digitableLine = this.generateDigitableLine(barcode);
        
        return {
            barcode: barcode,
            digitable_line: digitableLine,
            our_number: ourNumber || Date.now().toString().slice(-10),
            amount: amount,
            due_date: dueDate,
            payer: payer,
            description: description,
            bank: this.config.cooperativa,
            agency: this.config.agency,
            account: this.config.account,
            acceptance_date: today.toLocaleDateString('pt-BR'),
            instructions: 'Juros de 1% ao mês + multa de 2% após vencimento',
            status: 'pending',
            created_at: today.toISOString()
        };
    },

    generateBarcode(amount, dueDate) {
        const factorVencimento = this.calculateDueFactor(dueDate);
        const valueStr = Math.round(amount * 100).toString().padStart(10, '0');
        return `${this.config.bank_code}9${factorVencimento}${valueStr}00000000000`;
    },

    calculateDueFactor(date) {
        const baseDate = new Date('1997-10-07');
        const targetDate = new Date(date);
        const diffTime = targetDate.getTime() - baseDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays.toString().padStart(4, '0');
    },

    generateDigitableLine(barcode) {
        // Simulação de linha digitável
        const fields = [
            barcode.substring(0, 5),
            barcode.substring(5, 15),
            barcode.substring(15, 25),
            barcode.substring(25)
        ];
        return fields.join(' ');
    },

    // Gerar PDF do boleto
    generateBoletoPDF(boletoData) {
        const doc = new jspdf.jsPDF();
        
        // Cabeçalho
        doc.setFillColor(20, 28, 46);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text('CondoSphere ERP', 20, 15);
        doc.setFontSize(10);
        doc.text('Boleto de Cobrança', 20, 25);
        doc.setFontSize(8);
        doc.text('Documento gerado eletronicamente', 20, 32);

        // Linha do boleto
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('VENCIMENTO', 15, 55);
        doc.text(boletoData.due_date, 15, 62);
        
        doc.text('VALOR DO DOCUMENTO', 80, 55);
        doc.text('R$ ' + boletoData.amount.toFixed(2).replace('.', ','), 80, 62);

        doc.text('PAGADOR', 15, 75);
        doc.text(boletoData.payer, 15, 82);

        doc.text('INSTRUÇÕES', 15, 95);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        doc.text(boletoData.instructions, 15, 102);

        doc.setFontSize(8);
        doc.text('Código de Barras:', 15, 120);
        doc.setFontSize(10);
        doc.text(boletoData.barcode, 15, 128);

        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Banco: ${boletoData.bank} | Ag: ${boletoData.agency} | C/C: ${boletoData.account}`, 15, 145);
        doc.text(`Nosso Número: ${boletoData.our_number}`, 15, 152);

        // Rodapé
        doc.setFillColor(240, 245, 255);
        doc.rect(0, 270, 210, 27, 'F');
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(7);
        doc.text('CondoSphere ERP - Documento gerado eletronicamente', 10, 280);
        doc.text('Este boleto não precisa de intervenção manual.', 10, 285);

        return doc;
    },

    // =====================================================================
    // GERAÇÃO DE PIX (QR CODE)
    // =====================================================================
    generatePIX(amount, description, payerName) {
        const txid = Date.now().toString(36).toUpperCase();
        const pixKey = this.config.cnpj;
        
        // Payload PIX (EMV standard)
        const payload = {
            pix_key: pixKey,
            merchant_name: 'CondoSphere ERP',
            merchant_city: 'São Paulo',
            amount: amount,
            description: description,
            txid: txid,
            currency: 'BRL',
            country_code: 'BR'
        };

        // Gerar QR Code Data URL (simulação)
        const qrData = this.generatePIXPayload(payload);
        
        return {
            ...payload,
            qr_code_payload: qrData,
            copy_paste: this.generatePIXCopyPaste(payload),
            expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            status: 'active'
        };
    },

    generatePIXPayload(payload) {
        // Formato EMV do PIX
        const merchantAccountInfo = `0014br.gov.bcb.pix01${payload.pix_key}`;
        const txidHex = Array.from(payload.txid).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
        
        return `00020126360014br.gov.bcb.pix01${payload.pix_key}52040000530398685404${(payload.amount * 100).toFixed(0).padStart(10, '0')}5802BR5913${payload.merchant_name.substring(0, 13).padEnd(13, ' ')}6007${payload.merchant_city.padEnd(7, ' ')}62070503***6304`;
    },

    generatePIXCopyPaste(payload) {
        return `00020126360014br.gov.bcb.pix01${payload.pix_key}52040000530398685404${(payload.amount * 100).toFixed(0).padStart(10, '0')}5802BR5913${payload.merchant_name.padEnd(13, ' ')}6007São Paulo62070503***6304`;
    },

    // =====================================================================
    // GERAÇÃO CNAB240/400
    // =====================================================================
    generateCNAB240Header(companyData) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = now.toTimeString().substring(0, 4).replace(':', '');
        
        return {
            bank_code: this.config.bank_code,
            service_code: '000',
            date: dateStr,
            sequence: '00001',
            company_code: companyData.cnpj || this.config.cnpj,
            company_name: companyData.name || 'CondoSphere',
            company_address: companyData.address || '',
            company_neighborhood: '',
            company_city: '',
            company_state: '',
            company_cep: '',
            company_phone: '',
            company_cnae: '',
            company_resp_name: '',
            bank_agency: this.config.agency,
            bank_account: this.config.account,
            bank_account_dv: '0',
            version: '084',
            filler: ''.padEnd(25, ' ')
        };
    },

    generateCNAB240SegmentT(record) {
        const now = new Date();
        return {
            bank_code: this.config.bank_code,
            service_code: '001',
            our_number: record.our_number || Date.now().toString().slice(-10),
            due_date: record.due_date.replace(/-/g, ''),
            value: (record.value * 100).toFixed(0).padStart(13, '0'),
            payer_name: record.payer_name.substring(0, 30).padEnd(30, ' '),
            payer_document: record.payer_document || '',
            payment_location: record.location || '',
            due_date_calc: record.due_date.replace(/-/g, ''),
            value_calc: (record.value * 100).toFixed(0).padStart(13, '0')
        };
    },

    // =====================================================================
    // PROCESSAMENTO DE ARQUIVOS DE RETORNO
    // =====================================================================
    parseCNAB240Return(fileContent) {
        const lines = fileContent.split(/\r?\n/);
        const results = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.length >= 240 && line.substring(13, 14) === 'T') {
                const segmentT = line;
                const segmentU = lines[i+1] && lines[i+1].substring(13, 14) === 'U' ? lines[i+1] : null;
                
                const nossoNumero = segmentT.substring(37, 47).trim().replace(/^0+/, '');
                const name = segmentT.substring(143, 183).trim();
                
                let valuePaid = 0;
                let status = 'pending';
                
                if (segmentU) {
                    valuePaid = parseInt(segmentU.substring(77, 92).trim()) / 100;
                    const returnCode = segmentU.substring(15, 17).trim();
                    status = this.getReturnStatus(returnCode);
                }
                
                results.push({
                    nosso_numero: nossoNumero,
                    payer_name: name,
                    value_paid: valuePaid,
                    status: status,
                    processed_at: new Date().toISOString()
                });
            }
        }
        
        return results;
    },

    getReturnStatus(code) {
        const statusMap = {
            '00': 'paid',
            '01': 'pending',
            '02': 'cancelled',
            '03': 'protested',
            '06': 'returned',
            '09': 'returned',
            '10': 'paid_partial'
        };
        return statusMap[code] || 'unknown';
    },

    parseCNAB400Return(fileContent) {
        const lines = fileContent.split(/\r?\n/);
        const results = [];
        
        for (const line of lines) {
            if (line.length >= 400 && line.substring(0, 1) === '1') {
                const nossoNumero = line.substring(37, 47).trim();
                const valuePaid = parseInt(line.substring(152, 165).trim()) / 100;
                const status = this.getReturnStatus(line.substring(213, 215).trim());
                const name = line.substring(32, 62).trim();
                
                results.push({
                    nosso_numero: nossoNumero,
                    payer_name: name,
                    value_paid: valuePaid,
                    status: status,
                    processed_at: new Date().toISOString()
                });
            }
        }
        
        return results;
    },

    // =====================================================================
    // PROCESSAMENTO DE PAGAMENTOS
    // =====================================================================
    async processPayment(paymentData) {
        const { receivable_id, amount, payment_method, payer_name } = paymentData;
        
        // Registrar pagamento
        const payment = {
            receivable_id,
            amount,
            payment_method,
            payer_name,
            payment_date: new Date().toISOString().split('T')[0],
            status: 'confirmed',
            notes: `Pagamento via ${payment_method}`
        };

        // Atualizar status da cobrança
        await window.supabaseClient
            .from('receivables')
            .update({ status: 'Pago' })
            .eq('id', receivable_id);

        // Registrar no histórico
        await window.supabaseClient
            .from('payment_history')
            .insert([payment]);

        // Registrar atividade
        await window.supabaseClient
            .from('activity_log')
            .insert([{
                action: 'payment_processed',
                table_name: 'receivables',
                record_id: receivable_id,
                new_data: payment
            }]);

        return payment;
    },

    // =====================================================================
    // REMESSA BANCÁRIA (PAGFOR)
    // =====================================================================
    generatePagforRemittance(payments) {
        let remittance = '';
        
        // Header
        remittance += this.generatePagforHeader();
        
        // Detalhes
        payments.forEach(payment => {
            remittance += this.generatePagforDetail(payment);
        });
        
        // Trailer
        remittance += this.generatePagforTrailer(payments.length);
        
        return remittance;
    },

    generatePagforHeader() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        return `02RETORNO01${this.config.bank_code}COOPERATIVO           ${dateStr}000001B${dateStr}\n`;
    },

    generatePagforDetail(payment) {
        const value = (payment.amount * 100).toFixed(0).padStart(13, '0');
        return `02${payment.payer_document.padEnd(20, ' ')}${this.config.agency}${this.config.account}${value}${payment.payer_name.padEnd(30, ' ')}${payment.payer_document}000000\n`;
    },

    generatePagforTrailer(recordCount) {
        return `02${String(recordCount + 2).padStart(6, '0')}${''.padEnd(391, '0')}\n`;
    }
};

// =====================================================================
// EXPORTAR
// =====================================================================
if (typeof window !== 'undefined') {
    window.BankingIntegration = BankingIntegration;
}
