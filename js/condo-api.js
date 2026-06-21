/* =====================================================================
   CONDOSPHERE - API REST
   Endpoints para integrações externas
   ===================================================================== */

const CondoAPI = {
    // Configuração da API
    config: {
        baseUrl: 'https://psbvjscrqhwhttvbstty.supabase.co/rest/v1',
        apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYnZqc2NycWh3aHR0dmJzdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTA4MzAsImV4cCI6MjA5Njg2NjgzMH0.AFnX7TYKrpTSQMBEU9Rwj0g8nvgpSEDKSjGNb-FM2Gw',
        version: 'v1'
    },

    // Headers padrão
    getHeaders() {
        return {
            'apikey': this.config.apiKey,
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        };
    },

    // =====================================================================
    // MÉTODOS GENÉRICOS
    // =====================================================================
    async get(table, select = '*', filters = {}) {
        let url = `${this.config.baseUrl}/${table}?select=${select}`;
        for (const [key, value] of Object.entries(filters)) {
            url += `&${key}=eq.${encodeURIComponent(value)}`;
        }
        const res = await fetch(url, { headers: this.getHeaders() });
        if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
        return await res.json();
    },

    async post(table, data) {
        const res = await fetch(`${this.config.baseUrl}/${table}`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`POST ${table} failed: ${res.status}`);
        return await res.json();
    },

    async put(table, id, data) {
        const res = await fetch(`${this.config.baseUrl}/${table}?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`PUT ${table} failed: ${res.status}`);
        return await res.json();
    },

    async delete(table, id) {
        const res = await fetch(`${this.config.baseUrl}/${table}?id=eq.${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
        return true;
    },

    // =====================================================================
    // ENDPOINTS ESPECÍFICOS
    // =====================================================================

    // Residências
    residences: {
        list: (filters) => CondoAPI.get('residences', '*', filters),
        get: (id) => CondoAPI.get('residences', '*', { id }),
        create: (data) => CondoAPI.post('residences', data),
        update: (id, data) => CondoAPI.put('residences', id, data),
        delete: (id) => CondoAPI.delete('residences', id)
    },

    // Moradores
    residents: {
        list: (filters) => CondoAPI.get('residents', '*', filters),
        get: (id) => CondoAPI.get('residents', '*', { id }),
        create: (data) => CondoAPI.post('residents', data),
        update: (id, data) => CondoAPI.put('residents', id, data),
        delete: (id) => CondoAPI.delete('residents', id)
    },

    // Veículos
    vehicles: {
        list: (filters) => CondoAPI.get('vehicles', '*', filters),
        get: (id) => CondoAPI.get('vehicles', '*', { id }),
        create: (data) => CondoAPI.post('vehicles', data),
        update: (id, data) => CondoAPI.put('vehicles', id, data),
        delete: (id) => CondoAPI.delete('vehicles', id)
    },

    // Contas a Receber
    receivables: {
        list: (filters) => CondoAPI.get('receivables', '*', filters),
        get: (id) => CondoAPI.get('receivables', '*', { id }),
        create: (data) => CondoAPI.post('receivables', data),
        update: (id, data) => CondoAPI.put('receivables', id, data),
        delete: (id) => CondoAPI.delete('receivables', id)
    },

    // Contas a Pagar
    payables: {
        list: (filters) => CondoAPI.get('payables', '*', filters),
        get: (id) => CondoAPI.get('payables', '*', { id }),
        create: (data) => CondoAPI.post('payables', data),
        update: (id, data) => CondoAPI.put('payables', id, data),
        delete: (id) => CondoAPI.delete('payables', id)
    },

    // Funcionários
    employees: {
        list: (filters) => CondoAPI.get('employees', '*', filters),
        get: (id) => CondoAPI.get('employees', '*', { id }),
        create: (data) => CondoAPI.post('employees', data),
        update: (id, data) => CondoAPI.put('employees', id, data),
        delete: (id) => CondoAPI.delete('employees', id)
    },

    // Áreas Comuns
    commonAreas: {
        list: (filters) => CondoAPI.get('common_areas', '*', filters),
        get: (id) => CondoAPI.get('common_areas', '*', { id }),
        create: (data) => CondoAPI.post('common_areas', data),
        update: (id, data) => CondoAPI.put('common_areas', id, data),
        delete: (id) => CondoAPI.delete('common_areas', id)
    },

    // Reservas
    reservations: {
        list: (filters) => CondoAPI.get('space_reservations', '*', filters),
        get: (id) => CondoAPI.get('space_reservations', '*', { id }),
        create: (data) => CondoAPI.post('space_reservations', data),
        update: (id, data) => CondoAPI.put('space_reservations', id, data),
        delete: (id) => CondoAPI.delete('space_reservations', id)
    },

    // Assembleias
    assemblies: {
        list: (filters) => CondoAPI.get('virtual_assemblies', '*', filters),
        get: (id) => CondoAPI.get('virtual_assemblies', '*', { id }),
        create: (data) => CondoAPI.post('virtual_assemblies', data),
        update: (id, data) => CondoAPI.put('virtual_assemblies', id, data),
        delete: (id) => CondoAPI.delete('virtual_assemblies', id)
    },

    // Pautas
    proposals: {
        list: (filters) => CondoAPI.get('assembly_proposals', '*', filters),
        create: (data) => CondoAPI.post('assembly_proposals', data),
        update: (id, data) => CondoAPI.put('assembly_proposals', id, data)
    },

    // Votos
    votes: {
        list: (filters) => CondoAPI.get('assembly_votes', '*', filters),
        create: (data) => CondoAPI.post('assembly_votes', data)
    },

    // Documentos
    documents: {
        list: (filters) => CondoAPI.get('documents', '*', filters),
        get: (id) => CondoAPI.get('documents', '*', { id }),
        create: (data) => CondoAPI.post('documents', data),
        update: (id, data) => CondoAPI.put('documents', id, data),
        delete: (id) => CondoAPI.delete('documents', id)
    },

    // Notificações
    notifications: {
        list: (filters) => CondoAPI.get('notifications', '*', filters),
        create: (data) => CondoAPI.post('notifications', data),
        markRead: (id) => CondoAPI.put('notifications', id, { is_read: true })
    },

    // Prestadores
    providers: {
        list: (filters) => CondoAPI.get('providers', '*', filters),
        get: (id) => CondoAPI.get('providers', '*', { id }),
        create: (data) => CondoAPI.post('providers', data),
        update: (id, data) => CondoAPI.put('providers', id, data),
        delete: (id) => CondoAPI.delete('providers', id)
    },

    // Planos de Licenciamento
    plans: {
        list: (filters) => CondoAPI.get('license_plans', '*', filters),
        get: (id) => CondoAPI.get('license_plans', '*', { id }),
        create: (data) => CondoAPI.post('license_plans', data),
        update: (id, data) => CondoAPI.put('license_plans', id, data),
        delete: (id) => CondoAPI.delete('license_plans', id)
    },

    // Assinaturas
    subscriptions: {
        list: (filters) => CondoAPI.get('subscriptions', '*', filters),
        get: (id) => CondoAPI.get('subscriptions', '*', { id }),
        create: (data) => CondoAPI.post('subscriptions', data),
        update: (id, data) => CondoAPI.put('subscriptions', id, data)
    },

    // Permissões
    permissions: {
        list: (filters) => CondoAPI.get('module_permissions', '*', filters),
        create: (data) => CondoAPI.post('module_permissions', data),
        update: (id, data) => CondoAPI.put('module_permissions', id, data)
    },

    // Configurações
    settings: {
        get: async (key) => {
            const data = await CondoAPI.get('tenant_settings', '*', { setting_key: key });
            return data[0]?.setting_value;
        },
        set: async (key, value) => {
            const existing = await CondoAPI.get('tenant_settings', '*', { setting_key: key });
            if (existing.length > 0) {
                return await CondoAPI.put('tenant_settings', existing[0].id, { setting_value: value });
            } else {
                return await CondoAPI.post('tenant_settings', { setting_key: key, setting_value: value });
            }
        }
    },

    // Log de Atividades
    activityLog: {
        list: (filters) => CondoAPI.get('activity_log', '*', filters),
        create: (data) => CondoAPI.post('activity_log', data)
    },

    // =====================================================================
    // ENDPOINTS DE RELATÓRIOS
    // =====================================================================
    reports: {
        async monthlyBalance(month, year) {
            const receivables = await CondoAPI.receivables.list({});
            const payables = await CondoAPI.payables.list({});
            
            const monthReceivables = receivables.filter(r => {
                const d = new Date(r.due_date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });
            
            const monthPayables = payables.filter(p => {
                const d = new Date(p.due_date);
                return d.getMonth() + 1 === month && d.getFullYear() === year;
            });
            
            return {
                month, year,
                totalReceitas: monthReceivables.filter(r => r.status === 'Pago').reduce((s, r) => s + r.base_value, 0),
                totalDespesas: monthPayables.filter(p => p.status === 'Pago').reduce((s, p) => s + p.value, 0),
                receivables: monthReceivables,
                payables: monthPayables
            };
        },

        async dre(month, year) {
            const balance = await this.monthlyBalance(month, year);
            const employees = await CondoAPI.employees.list({});
            const totalFolha = employees.reduce((s, e) => s + (e.salary || 0), 0);
            
            return {
                receitaBruta: balance.totalReceitas,
                receitaLiquida: balance.totalReceitas * 0.95,
                despesasFolha: totalFolha,
                despesasGerais: balance.totalDespesas - totalFolha,
                superavit: balance.totalReceitas - balance.totalDespesas
            };
        }
    }
};

// =====================================================================
// EXPORTAR
// =====================================================================
if (typeof window !== 'undefined') {
    window.CondoAPI = CondoAPI;
}
