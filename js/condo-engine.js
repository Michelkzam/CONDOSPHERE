/* =====================================================================
   CONDOSPHERE - Motor de Cálculos Financeiros e Funcionalidades CLT
   Base Legal: Lei 4.591/64, Código Civil, CLT, LGPD
   ===================================================================== */

const CondoFinance = {
    // =====================================================================
    // 1. CÁLCULOS FINANCEIROS (Art. 12§3 Lei 4.591/64)
    // =====================================================================
    
    // Taxa de multa moratória: até 20% sobre o débito
    FINE_RATE: 0.20,
    
    // Taxa de juros moratórios: 1% ao mês
    INTEREST_RATE_MONTHLY: 0.01,
    
    // Taxa do fundo de reserva: mínimo 5%
    RESERVE_FUND_RATE: 0.05,
    
    // Calcular multa moratória (Art. 12§3)
    calculateFine(baseValue, delayDays) {
        if (delayDays <= 0) return 0;
        return baseValue * this.FINE_RATE;
    },
    
    // Calcular juros moratórios (1% ao mês, proporcional)
    calculateInterest(baseValue, delayDays) {
        if (delayDays <= 0) return 0;
        const months = Math.ceil(delayDays / 30);
        return baseValue * this.INTEREST_RATE_MONTHLY * months;
    },
    
    // Calcular valor total devido com juros e multas
    calculateTotalDue(baseValue, delayDays, extraCharges = 0, discounts = 0) {
        const fine = this.calculateFine(baseValue, delayDays);
        const interest = this.calculateInterest(baseValue, delayDays);
        return baseValue + extraCharges + fine + interest - discounts;
    },
    
    // Calcular fundo de reserva (5% das cotas)
    calculateReserveFund(monthlyRevenue) {
        return monthlyRevenue * this.RESERVE_FUND_RATE;
    },

    // =====================================================================
    // 2. CÁLCULOS CLT (Consolidação das Leis do Trabalho)
    // =====================================================================
    
    // Tabela progressiva INSS 2024
    INSS_TABLE: [
        { min: 0, max: 1412.00, rate: 0.075, deduction: 0 },
        { min: 1412.01, max: 2666.68, rate: 0.09, deduction: 10.59 },
        { min: 2666.69, max: 4000.03, rate: 0.12, deduction: 81.60 },
        { min: 4000.04, max: 7786.02, rate: 0.14, deduction: 163.84 }
    ],
    
    // Tabela progressiva IRRF 2024
    IRRF_TABLE: [
        { min: 0, max: 2259.20, rate: 0, deduction: 0 },
        { min: 2259.21, max: 2826.65, rate: 0.075, deduction: 169.44 },
        { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 381.44 },
        { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 662.77 },
        { min: 4664.69, max: Infinity, rate: 0.275, deduction: 896.00 }
    ],
    
    // Calcular INSS patronal (20%)
    calculateEmployerINSS(salary) {
        return salary * 0.20;
    },
    
    // Calcular INSS do empregado (tabela progressiva)
    calculateEmployeeINSS(salary) {
        for (const bracket of this.INSS_TABLE) {
            if (salary >= bracket.min && salary <= bracket.max) {
                return salary * bracket.rate - bracket.deduction;
            }
        }
        return 0;
    },
    
    // Calcular FGTS (8% sobre remuneração)
    calculateFGTS(salary) {
        return salary * 0.08;
    },
    
    // Calcular IRRF (tabela progressiva)
    calculateIRRF(salary, inssDeduction = 0) {
        const base = salary - inssDeduction;
        for (const bracket of this.IRRF_TABLE) {
            if (base >= bracket.min && base <= bracket.max) {
                return Math.max(0, base * bracket.rate - bracket.deduction);
            }
        }
        return 0;
    },
    
    // Calcular horas extras 50%
    calculateOvertime50(hourlyRate, hours) {
        return hourlyRate * 1.5 * hours;
    },
    
    // Calcular horas extras 100%
    calculateOvertime100(hourlyRate, hours) {
        return hourlyRate * 2.0 * hours;
    },
    
    // Calcular adicional noturno (20%)
    calculateNightPremium(hourlyRate, hours) {
        return hourlyRate * 0.20 * hours;
    },
    
    // Calcular DSR (Descanso Semanal Remunerado)
    calculateDSR(monthlySalary) {
        return monthlySalary / 30; // 1 dia de salário por semana
    },
    
    // Calcular 13º salário proporcional
    calculateThirteenthSalary(monthlySalary, monthsWorked) {
        return (monthlySalary / 12) * monthsWorked;
    },
    
    // Calcular férias proporcionais + 1/3
    calculateVacation(monthlySalary, monthsWorked) {
        const vacationBase = (monthlySalary / 12) * monthsWorked;
        const vacationBonus = vacationBase / 3;
        return { base: vacationBase, bonus: vacationBonus, total: vacationBase + vacationBonus };
    },
    
    // Calcular verbas rescisórias
    calculateRescision(salary, monthsWorked, reason = 'sem_justa') {
        const result = {
            saldo_salario: 0,
            decimo_terceiro: 0,
            ferias_proporcionais: 0,
            um_terco_ferias: 0,
            multa_fgts: 0,
            aviso_previo: 0,
            total: 0
        };
        
        // Saldo de salário (dias trabalhados no mês)
        const dailyRate = salary / 30;
        result.saldo_salario = dailyRate * 15; // Exemplo: 15 dias
        
        // 13º proporcional
        result.decimo_terceiro = this.calculateThirteenthSalary(salary, monthsWorked);
        
        // Férias proporcionais + 1/3
        const vacation = this.calculateVacation(salary, monthsWorked);
        result.ferias_proporcionais = vacation.base;
        result.um_terco_ferias = vacation.bonus;
        
        if (reason === 'sem_justa') {
            // Multa FGTS 40%
            result.multa_fgts = this.calculateFGTS(salary) * 0.40;
            // Aviso prévio (30 dias + 3 por ano)
            const years = Math.floor(monthsWorked / 12);
            result.aviso_previo = salary + (salary / 30) * 3 * years;
        }
        
        result.total = result.saldo_salario + result.decimo_terceiro + 
                       result.ferias_proporcionais + result.um_terco_ferias + 
                       result.multa_fgts + result.aviso_previo;
        
        return result;
    },
    
    // Calcular vale-transporte (desconto até 6% da folha)
    calculateTransportVoucher(salary, routeCost) {
        const maxDiscount = salary * 0.06;
        return Math.min(routeCost, maxDiscount);
    },
    
    // Calcular vale-alimentação (sem desconto obrigatório)
    calculateFoodVoucher(amount) {
        return amount;
    }
};

// =====================================================================
// 3. PORTAL DO MORADOR RESTRITO (LGPD)
// =====================================================================
const ResidentPortal = {
    // Filtrar dados pelo morador logado
    filterByResident(residentId, data) {
        return data.filter(item => item.resident_id === residentId || item.resident_name === residentId);
    },
    
    // Verificar se o morador pode acessar o dado
    canAccess(residentId, dataOwnerId) {
        return residentId === dataOwnerId;
    },
    
    // Gerar resumo financeiro do morador
    generateFinancialSummary(residentId, receivables, payments) {
        const residentReceivables = receivables.filter(r => r.resident_id === residentId);
        const residentPayments = payments.filter(p => p.resident_id === residentId);
        
        const totalDue = residentReceivables
            .filter(r => r.status !== 'Pago')
            .reduce((sum, r) => sum + CondoFinance.calculateTotalDue(r.base_value, r.delay_days, r.extra_fees, r.agreed_discounts), 0);
        
        const totalPaid = residentPayments
            .filter(p => p.status === 'confirmed')
            .reduce((sum, p) => sum + p.amount, 0);
        
        return {
            totalDue,
            totalPaid,
            pendingCount: residentReceivables.filter(r => r.status !== 'Pago').length,
            paidCount: residentPayments.filter(p => p.status === 'confirmed').length,
            nextDue: this.getNextDueDate(residentReceivables)
        };
    },
    
    getNextDueDate(receivables) {
        const pending = receivables
            .filter(r => r.status !== 'Pago')
            .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        return pending.length > 0 ? pending[0].due_date : null;
    }
};

// =====================================================================
// 4. SISTEMA DE NOTIFICAÇÕES
// =====================================================================
const NotificationSystem = {
    async sendNotification(title, message, type = 'info', targetRole = null, targetResidentId = null) {
        const notification = {
            title,
            message,
            notification_type: type,
            priority: type === 'urgent' ? 'high' : 'normal',
            target_role: targetRole,
            target_resident_id: targetResidentId,
            is_read: false
        };
        
        // Save to Supabase
        if (window.supabaseClient) {
            await window.supabaseClient.from('notifications').insert([notification]);
        }
        
        // Show toast
        if (typeof showToast === 'function') {
            showToast(title, type === 'urgent' ? 'warning' : 'info');
        }
        
        return notification;
    },
    
    async getNotifications(residentId = null, role = null) {
        let query = window.supabaseClient.from('notifications').select('*');
        if (residentId) query = query.eq('target_resident_id', residentId);
        if (role) query = query.eq('target_role', role);
        return await query.order('created_at', { ascending: false });
    },
    
    async markAsRead(notificationId) {
        return await window.supabaseClient
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId);
    }
};

// =====================================================================
// 5. ASSEMBLEIAS COM QUÓRUM (Art. 24§3 Lei 4.591/64)
// =====================================================================
const AssemblyManager = {
    // Calcular quórum baseado em fração ideal (não por quantidade)
    calculateQuorum(totalUnits, totalIdealFraction) {
        if (totalIdealFraction === 0) return 0;
        return (totalUnits / totalIdealFraction) * 100;
    },
    
    // Verificar se quórum foi atingido (2/3 para convenção)
    hasQuorumMet(votesCast, totalUnits, requiredFraction = 2/3) {
        return votesCast >= (totalUnits * requiredFraction);
    },
    
    // Registrar voto com validações
    async castVote(assemblyId, proposalId, voterId, voterName, voterUnit, voteValue) {
        // Verificar se já votou
        const existingVote = await window.supabaseClient
            .from('assembly_votes')
            .select('*')
            .eq('assembly_id', assemblyId)
            .eq('proposal_id', proposalId)
            .eq('voter_id', voterId);
        
        if (existingVote.data && existingVote.data.length > 0) {
            throw new Error('Você já votou nesta pauta!');
        }
        
        // Registrar voto
        const vote = {
            assembly_id: assemblyId,
            proposal_id: proposalId,
            voter_id: voterId,
            voter_name: voterName,
            voter_unit: voterUnit,
            vote_value: voteValue,
            ip_address: 'web'
        };
        
        await window.supabaseClient.from('assembly_votes').insert([vote]);
        
        // Atualizar contagem
        const proposal = await window.supabaseClient
            .from('assembly_proposals')
            .select('*')
            .eq('id', proposalId)
            .single();
        
        const update = {};
        if (voteValue === 'yes') update.yes_votes = (proposal.data.yes_votes || 0) + 1;
        else if (voteValue === 'no') update.no_votes = (proposal.data.no_votes || 0) + 1;
        else update.abstain_votes = (proposal.data.abstain_votes || 0) + 1;
        
        await window.supabaseClient
            .from('assembly_proposals')
            .update(update)
            .eq('id', proposalId);
        
        return vote;
    },
    
    // Gerar ata da assembleia
    generateMinutes(assembly, proposals, votes) {
        let minutes = `ATA DE ASSEMBLEIA GERAL\n`;
        minutes += `========================\n\n`;
        minutes += `Título: ${assembly.title}\n`;
        minutes += `Descrição: ${assembly.description || 'N/A'}\n`;
        minutes += `Data de Início: ${new Date(assembly.start_date).toLocaleDateString('pt-BR')}\n`;
        minutes += `Data de Fim: ${new Date(assembly.end_date).toLocaleDateString('pt-BR')}\n`;
        minutes += `Total de Unidades: ${assembly.total_units}\n`;
        minutes += `Total de Votos: ${votes.length}\n`;
        minutes += `Quórum: ${((votes.length / assembly.total_units) * 100).toFixed(1)}%\n\n`;
        
        minutes += `PAUTAS E RESULTADOS:\n`;
        minutes += `========================\n\n`;
        
        proposals.forEach((proposal, index) => {
            const total = proposal.yes_votes + proposal.no_votes + (proposal.abstain_votes || 0);
            minutes += `Pauta #${proposal.proposal_number}: ${proposal.title}\n`;
            minutes += `Descrição: ${proposal.description || 'N/A'}\n`;
            minutes += `Sim: ${proposal.yes_votes} (${total > 0 ? ((proposal.yes_votes/total)*100).toFixed(1) : 0}%)\n`;
            minutes += `Não: ${proposal.no_votes} (${total > 0 ? ((proposal.no_votes/total)*100).toFixed(1) : 0}%)\n`;
            minutes += `Abstenções: ${proposal.abstain_votes || 0}\n`;
            minutes += `Resultado: ${proposal.yes_votes > proposal.no_votes ? 'APROVADA' : 'REJEITADA'}\n\n`;
        });
        
        minutes += `\nData de Geração: ${new Date().toLocaleString('pt-BR')}\n`;
        minutes += `Documento gerado eletronicamente pelo CondoSphere ERP`;
        
        return minutes;
    }
};

// =====================================================================
// 6. MULTI-TENANT (Licenciamento)
// =====================================================================
const TenantManager = {
    // Verificar limites do plano
    async checkPlanLimits(tenantId, feature) {
        const tenant = await window.supabaseClient
            .from('subscriptions')
            .select('*, plan:license_plans(*)')
            .eq('id', tenantId)
            .single();
        
        if (!tenant.data || !tenant.data.plan) {
            throw new Error('Assinatura não encontrada');
        }
        
        const plan = tenant.data.plan;
        
        switch (feature) {
            case 'units':
                return tenant.data.current_units < plan.max_units;
            case 'employees':
                const empCount = await window.supabaseClient
                    .from('employees')
                    .select('id', { count: 'exact', head: true });
                return empCount.count < plan.max_employees;
            case 'areas':
                const areaCount = await window.supabaseClient
                    .from('common_areas')
                    .select('id', { count: 'exact', head: true });
                return areaCount.count < plan.max_common_areas;
            default:
                return plan.features && plan.features[feature];
        }
    },
    
    // Obter configurações do tenant
    async getTenantSettings(tenantId) {
        const { data } = await window.supabaseClient
            .from('tenant_settings')
            .select('*');
        return data;
    }
};

// =====================================================================
// 7. LGPD COMPLIANCE
// =====================================================================
const LGPDCompliance = {
    // Registrar consentimento
    async recordConsent(residentId, consentType, granted) {
        await window.supabaseClient.from('activity_log').insert([{
            user_id: residentId,
            action: 'consent_' + (granted ? 'granted' : 'revoked'),
            table_name: 'residents',
            record_id: residentId,
            new_data: { consent_type: consentType, granted, timestamp: new Date().toISOString() }
        }]);
    },
    
    // Direito ao esquecimento - anonimizar dados
    async anonymizeResident(residentId) {
        const anonymizedData = {
            name: 'ANONIMIZADO',
            cpf: '000.000.000-00',
            contact: 'ANONIMIZADO',
            role: 'ANONIMIZADO'
        };
        
        await window.supabaseClient
            .from('residents')
            .update(anonymizedData)
            .eq('id', residentId);
        
        await this.recordConsent(residentId, 'anonymization', true);
    },
    
    // Exportar dados do morador (portabilidade)
    async exportResidentData(residentId) {
        const resident = await window.supabaseClient
            .from('residents')
            .select('*')
            .eq('id', residentId)
            .single();
        
        const payments = await window.supabaseClient
            .from('payment_history')
            .select('*')
            .eq('resident_id', residentId);
        
        const reservations = await window.supabaseClient
            .from('space_reservations')
            .select('*')
            .eq('resident_id', residentId);
        
        return {
            personal_data: resident.data,
            payment_history: payments.data,
            reservations: reservations.data,
            export_date: new Date().toISOString(),
            data_controller: 'CondoSphere ERP'
        };
    },
    
    // Registrar acesso a dados
    async logDataAccess(userId, action, table, recordId) {
        await window.supabaseClient.from('activity_log').insert([{
            user_id: userId,
            action: action,
            table_name: table,
            record_id: recordId,
            created_at: new Date().toISOString()
        }]);
    }
};

// =====================================================================
// 8. RELATÓRIOS AUTOMATIZADOS
// =====================================================================
const ReportGenerator = {
    // Gerar balancete mensal
    async generateMonthlyBalance(month, year) {
        const receivables = await window.supabaseClient
            .from('receivables')
            .select('*')
            .gte('due_date', `${year}-${String(month).padStart(2,'0')}-01`)
            .lt('due_date', `${year}-${String(month+1).padStart(2,'0')}-01`);
        
        const payables = await window.supabaseClient
            .from('payables')
            .select('*')
            .gte('due_date', `${year}-${String(month).padStart(2,'0')}-01`)
            .lt('due_date', `${year}-${String(month+1).padStart(2,'0')}-01`);
        
        const totalReceitas = receivables.data
            .filter(r => r.status === 'Pago')
            .reduce((sum, r) => sum + r.base_value, 0);
        
        const totalDespesas = payables.data
            .filter(p => p.status === 'Pago')
            .reduce((sum, p) => sum + p.value, 0);
        
        return {
            month,
            year,
            totalReceitas,
            totalDespesas,
            saldo: totalReceitas - totalDespesas,
            receivables: receivables.data,
            payables: payables.data
        };
    },
    
    // Gerar DRE
    async generateDRE(month, year) {
        const balance = await this.generateMonthlyBalance(month, year);
        
        const employees = await window.supabaseClient.from('employees').select('*');
        const totalFolha = employees.data.reduce((sum, e) => sum + (e.salary || 0), 0);
        
        return {
            receitaBruta: balance.totalReceitas,
            descontoInadimplencia: 0,
            receitaLiquida: balance.totalReceitas,
            despesasFolha: totalFolha,
            despesasGerais: balance.totalDespesas - totalFolha,
            superavit: balance.totalReceitas - balance.totalDespesas
        };
    }
};

// =====================================================================
// 9. GERAÇÃO DE GUIAS FISCAIS (CLT)
// =====================================================================
const TaxGuides = {
    // Gerar guia GPS (INSS)
    generateGPS(employees, month, year) {
        let totalINSS = 0;
        let totalFGTS = 0;
        
        employees.forEach(emp => {
            const inss = CondoFinance.calculateEmployeeINSS(emp.salary);
            const fgts = CondoFinance.calculateFGTS(emp.salary);
            totalINSS += inss;
            totalFGTS += fgts;
        });
        
        return {
            type: 'GPS',
            period: `${month}/${year}`,
            totalINSS: totalINSS,
            totalFGTS: totalFGTS,
            employees: employees.length,
            generated_at: new Date().toISOString()
        };
    },
    
    // Gerar DARF (IRRF)
    generateDARF(employees, month, year) {
        let totalIRRF = 0;
        
        employees.forEach(emp => {
            const inss = CondoFinance.calculateEmployeeINSS(emp.salary);
            const irrf = CondoFinance.calculateIRRF(emp.salary, inss);
            totalIRRF += irrf;
        });
        
        return {
            type: 'DARF',
            period: `${month}/${year}`,
            totalIRRF: totalIRRF,
            employees: employees.length,
            generated_at: new Date().toISOString()
        };
    },
    
    // Gerar GRF (FGTS)
    generateGRF(employees, month, year) {
        let totalFGTS = 0;
        
        employees.forEach(emp => {
            totalFGTS += CondoFinance.calculateFGTS(emp.salary);
        });
        
        return {
            type: 'GRF',
            period: `${month}/${year}`,
            totalFGTS: totalFGTS,
            employees: employees.length,
            generated_at: new Date().toISOString()
        };
    }
};

// =====================================================================
// 10. SISTEMA DE PAGAMENTOS
// =====================================================================
const PaymentSystem = {
    // Gerar QR Code PIX
    generatePIXQRCode(amount, description, beneficiary) {
        // Simulação de geração de QR Code PIX
        const pixKey = 'condosphere@pix.com.br';
        const txid = Date.now().toString(36).toUpperCase();
        
        return {
            pix_key: pixKey,
            amount: amount,
            description: description,
            beneficiary: beneficiary,
            txid: txid,
            qr_code_url: `https://pix.example.com/qr/${txid}`,
            expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
    },
    
    // Gerar dados de boleto
    generateBoleto(amount, dueDate, payer, description) {
        const ourNumber = Date.now().toString().slice(-10);
        const barcode = `23793.38128 60000.000003 00000.000400 1 ${dueDate.replace(/-/g, '')} ${String(amount).replace('.', '').padStart(10, '0')}`;
        
        return {
            barcode: barcode,
            our_number: ourNumber,
            amount: amount,
            due_date: dueDate,
            payer: payer,
            description: description,
            payment_url: `https://boleto.example.com/${ourNumber}`
        };
    }
};

// =====================================================================
// EXPORTAR MÓDULOS
// =====================================================================
if (typeof window !== 'undefined') {
    window.CondoFinance = CondoFinance;
    window.ResidentPortal = ResidentPortal;
    window.NotificationSystem = NotificationSystem;
    window.AssemblyManager = AssemblyManager;
    window.TenantManager = TenantManager;
    window.LGPDCompliance = LGPDCompliance;
    window.ReportGenerator = ReportGenerator;
    window.TaxGuides = TaxGuides;
    window.PaymentSystem = PaymentSystem;
}
