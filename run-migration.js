const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://psbvjscrqhwhttvbstty.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzYnZqc2NycWh3aHR0dmJzdHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTA4MzAsImV4cCI6MjA5Njg2NjgzMH0.AFnX7TYKrpTSQMBEU9Rwj0g8nvgpSEDKSjGNb-FM2Gw';

const supabase = createClient(supabaseUrl, supabaseKey);

const sql = `
-- TABELA DE PLANOS DE LICENCIAMENTO
CREATE TABLE IF NOT EXISTS public.license_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2) NOT NULL,
    max_units INTEGER NOT NULL DEFAULT 50,
    max_employees INTEGER NOT NULL DEFAULT 10,
    max_common_areas INTEGER NOT NULL DEFAULT 5,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.license_plans DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.license_plans;
CREATE POLICY "Allow public" ON public.license_plans FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.license_plans (name, description, price_monthly, price_annual, max_units, max_employees, max_common_areas, features) VALUES
('Básico', 'Plano para associações pequenas (até 50 unidades)', 97.00, 897.00, 50, 10, 5, '{"dashboard":true,"financial":true,"residents":true,"vehicles":true,"portaria":true,"areas":true,"reservations":true,"assemblies":false,"payroll":false,"reports":true}'),
('Profissional', 'Plano completo para associações médias (até 200 unidades)', 197.00, 1797.00, 200, 50, 20, '{"dashboard":true,"financial":true,"residents":true,"vehicles":true,"portaria":true,"areas":true,"reservations":true,"assemblies":true,"payroll":true,"reports":true}'),
('Enterprise', 'Plano ilimitado para grandes associações', 497.00, 4497.00, 999999, 999999, 999999, '{"dashboard":true,"financial":true,"residents":true,"vehicles":true,"portaria":true,"areas":true,"reservations":true,"assemblies":true,"payroll":true,"reports":true}')
ON CONFLICT DO NOTHING;

-- TABELA DE ASSINATURAS
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.license_plans(id),
    association_name VARCHAR(255) NOT NULL,
    association_cnpj VARCHAR(20),
    association_address TEXT,
    association_phone VARCHAR(50),
    association_email VARCHAR(255),
    responsible_name VARCHAR(255) NOT NULL,
    responsible_cpf VARCHAR(14),
    responsible_email VARCHAR(255),
    responsible_phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    next_billing_date DATE,
    payment_method VARCHAR(50),
    max_units INTEGER DEFAULT 50,
    current_units INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.subscriptions;
CREATE POLICY "Allow public" ON public.subscriptions FOR ALL USING (true) WITH CHECK (true);

-- TABELA DE DOCUMENTOS
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    file_url TEXT,
    file_type VARCHAR(50),
    file_size INTEGER,
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES public.document_folders(id),
    description TEXT,
    icon VARCHAR(50) DEFAULT 'folder',
    color VARCHAR(20) DEFAULT '#3b82f6',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_folders DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.documents;
DROP POLICY IF EXISTS "Allow public" ON public.document_folders;
CREATE POLICY "Allow public" ON public.documents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.document_folders FOR ALL USING (true) WITH CHECK (true);

-- TABELA DE PERMISSÕES POR MÓDULO
CREATE TABLE IF NOT EXISTS public.module_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id),
    module_name VARCHAR(100) NOT NULL,
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    can_import BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.module_permissions DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.module_permissions;
CREATE POLICY "Allow public" ON public.module_permissions FOR ALL USING (true) WITH CHECK (true);

-- TABELA DE RESERVAS MELHORADA
CREATE TABLE IF NOT EXISTS public.space_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID REFERENCES public.common_areas(id),
    space_name VARCHAR(255) NOT NULL,
    resident_id UUID REFERENCES public.residents(id),
    resident_name VARCHAR(255) NOT NULL,
    reservation_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_type VARCHAR(50) DEFAULT 'full_day',
    purpose VARCHAR(255),
    guests_count INTEGER DEFAULT 1,
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE ASSEMBLEIAS
CREATE TABLE IF NOT EXISTS public.virtual_assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assembly_type VARCHAR(50) DEFAULT 'ordinary',
    status VARCHAR(50) DEFAULT 'draft',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    location VARCHAR(255),
    quorum_required DECIMAL(5,2) DEFAULT 50.00,
    total_votes_cast INTEGER DEFAULT 0,
    total_units INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assembly_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID REFERENCES public.virtual_assemblies(id) ON DELETE CASCADE,
    proposal_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    proposal_type VARCHAR(50) DEFAULT 'standard',
    yes_votes INTEGER DEFAULT 0,
    no_votes INTEGER DEFAULT 0,
    abstain_votes INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.assembly_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assembly_id UUID REFERENCES public.virtual_assemblies(id) ON DELETE CASCADE,
    proposal_id UUID REFERENCES public.assembly_proposals(id) ON DELETE CASCADE,
    voter_id UUID REFERENCES public.users(id),
    voter_name VARCHAR(255),
    voter_unit VARCHAR(100),
    vote_value VARCHAR(20) NOT NULL,
    vote_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.space_reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_assemblies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assembly_votes DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.space_reservations;
DROP POLICY IF EXISTS "Allow public" ON public.virtual_assemblies;
DROP POLICY IF EXISTS "Allow public" ON public.assembly_proposals;
DROP POLICY IF EXISTS "Allow public" ON public.assembly_votes;
CREATE POLICY "Allow public" ON public.space_reservations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.virtual_assemblies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.assembly_proposals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.assembly_votes FOR ALL USING (true) WITH CHECK (true);

-- TABELA DE NOTIFICAÇÕES
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'normal',
    target_role VARCHAR(50),
    target_resident_id UUID REFERENCES public.residents(id),
    is_read BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ
);

-- TABELA DE HISTÓRICO DE PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_id UUID REFERENCES public.receivables(id),
    resident_id UUID REFERENCES public.residents(id),
    amount DECIMAL(12,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_date DATE NOT NULL,
    reference_month VARCHAR(20),
    status VARCHAR(50) DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE LOG DE ATIVIDADES
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- TABELA DE MENSALIDADES
CREATE TABLE IF NOT EXISTS public.monthly_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_id UUID REFERENCES public.residents(id),
    unit_identifier VARCHAR(150) NOT NULL,
    charge_month INTEGER NOT NULL,
    charge_year INTEGER NOT NULL,
    base_value DECIMAL(12,2) NOT NULL,
    extra_charges DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    fine_amount DECIMAL(12,2) DEFAULT 0,
    interest_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_date DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_charges DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.notifications;
DROP POLICY IF EXISTS "Allow public" ON public.payment_history;
DROP POLICY IF EXISTS "Allow public" ON public.activity_log;
DROP POLICY IF EXISTS "Allow public" ON public.monthly_charges;
CREATE POLICY "Allow public" ON public.notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.payment_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.activity_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public" ON public.monthly_charges FOR ALL USING (true) WITH CHECK (true);

-- TABELA DE CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tenant_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public" ON public.tenant_settings;
CREATE POLICY "Allow public" ON public.tenant_settings FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.tenant_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'CondoSphere', 'string', 'Nome do sistema'),
('currency', 'BRL', 'string', 'Moeda'),
('timezone', 'America/Sao_Paulo', 'string', 'Fuso horário'),
('fine_rate', '0.02', 'number', 'Taxa de multa (2%)'),
('interest_rate', '0.01', 'number', 'Taxa de juros mensal (1%)'),
('reserve_fund_rate', '0.05', 'number', 'Taxa fundo de reserva (5%)'),
('payment_due_day', '10', 'number', 'Dia de vencimento'),
('late_grace_days', '5', 'number', 'Dias de carência'),
('assembly_quorum', '2/3', 'string', 'Quórum assembleias'),
('fiscal_year_start', '1', 'number', 'Mês exercício fiscal')
ON CONFLICT (setting_key) DO NOTHING;
`;

async function runMigration() {
    console.log('Iniciando migração do banco de dados...');
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: sql });
        
        if (error) {
            console.error('Erro na migração:', error.message);
            
            // Tentar criar tabelas individualmente
            console.log('Tentando criar tabelas individualmente...');
            
            const tables = [
                {
                    name: 'license_plans',
                    sql: `CREATE TABLE IF NOT EXISTS public.license_plans (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name VARCHAR(100) NOT NULL,
                        description TEXT,
                        price_monthly DECIMAL(10,2) NOT NULL,
                        price_annual DECIMAL(10,2) NOT NULL,
                        max_units INTEGER NOT NULL DEFAULT 50,
                        max_employees INTEGER NOT NULL DEFAULT 10,
                        max_common_areas INTEGER NOT NULL DEFAULT 5,
                        features JSONB NOT NULL DEFAULT '{}'::jsonb,
                        is_active BOOLEAN DEFAULT true,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'subscriptions',
                    sql: `CREATE TABLE IF NOT EXISTS public.subscriptions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        plan_id UUID,
                        association_name VARCHAR(255) NOT NULL,
                        responsible_name VARCHAR(255) NOT NULL,
                        status VARCHAR(50) DEFAULT 'active',
                        billing_cycle VARCHAR(20) DEFAULT 'monthly',
                        max_units INTEGER DEFAULT 50,
                        current_units INTEGER DEFAULT 0,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
                        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'documents',
                    sql: `CREATE TABLE IF NOT EXISTS public.documents (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        category VARCHAR(100) NOT NULL,
                        file_url TEXT,
                        is_public BOOLEAN DEFAULT false,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'document_folders',
                    sql: `CREATE TABLE IF NOT EXISTS public.document_folders (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        name VARCHAR(255) NOT NULL,
                        description TEXT,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'module_permissions',
                    sql: `CREATE TABLE IF NOT EXISTS public.module_permissions (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        profile_id UUID,
                        module_name VARCHAR(100) NOT NULL,
                        can_view BOOLEAN DEFAULT false,
                        can_create BOOLEAN DEFAULT false,
                        can_edit BOOLEAN DEFAULT false,
                        can_delete BOOLEAN DEFAULT false,
                        can_export BOOLEAN DEFAULT false,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'space_reservations',
                    sql: `CREATE TABLE IF NOT EXISTS public.space_reservations (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        space_name VARCHAR(255) NOT NULL,
                        resident_name VARCHAR(255) NOT NULL,
                        reservation_date DATE NOT NULL,
                        start_time TIME,
                        end_time TIME,
                        purpose VARCHAR(255),
                        status VARCHAR(50) DEFAULT 'pending',
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'virtual_assemblies',
                    sql: `CREATE TABLE IF NOT EXISTS public.virtual_assemblies (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        status VARCHAR(50) DEFAULT 'draft',
                        start_date DATE NOT NULL,
                        end_date DATE NOT NULL,
                        total_units INTEGER DEFAULT 0,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
                        updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'assembly_proposals',
                    sql: `CREATE TABLE IF NOT EXISTS public.assembly_proposals (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        assembly_id UUID,
                        proposal_number INTEGER NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        yes_votes INTEGER DEFAULT 0,
                        no_votes INTEGER DEFAULT 0,
                        abstain_votes INTEGER DEFAULT 0,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'assembly_votes',
                    sql: `CREATE TABLE IF NOT EXISTS public.assembly_votes (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        assembly_id UUID,
                        proposal_id UUID,
                        voter_name VARCHAR(255),
                        vote_value VARCHAR(20) NOT NULL,
                        vote_timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'notifications',
                    sql: `CREATE TABLE IF NOT EXISTS public.notifications (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        title VARCHAR(255) NOT NULL,
                        message TEXT NOT NULL,
                        notification_type VARCHAR(50) DEFAULT 'info',
                        priority VARCHAR(20) DEFAULT 'normal',
                        target_role VARCHAR(50),
                        is_read BOOLEAN DEFAULT false,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'payment_history',
                    sql: `CREATE TABLE IF NOT EXISTS public.payment_history (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        amount DECIMAL(12,2) NOT NULL,
                        payment_method VARCHAR(50),
                        payment_date DATE NOT NULL,
                        status VARCHAR(50) DEFAULT 'confirmed',
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'activity_log',
                    sql: `CREATE TABLE IF NOT EXISTS public.activity_log (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        action VARCHAR(100) NOT NULL,
                        table_name VARCHAR(100),
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'monthly_charges',
                    sql: `CREATE TABLE IF NOT EXISTS public.monthly_charges (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        unit_identifier VARCHAR(150) NOT NULL,
                        charge_month INTEGER NOT NULL,
                        charge_year INTEGER NOT NULL,
                        base_value DECIMAL(12,2) NOT NULL,
                        total_amount DECIMAL(12,2) NOT NULL,
                        status VARCHAR(50) DEFAULT 'pending',
                        due_date DATE NOT NULL,
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                },
                {
                    name: 'tenant_settings',
                    sql: `CREATE TABLE IF NOT EXISTS public.tenant_settings (
                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                        setting_key VARCHAR(100) NOT NULL UNIQUE,
                        setting_value TEXT,
                        setting_type VARCHAR(50) DEFAULT 'string',
                        created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
                    )`
                }
            ];

            for (const table of tables) {
                try {
                    const { error: tableError } = await supabase.rpc('exec_sql', { sql: table.sql });
                    if (tableError) {
                        console.error(`Erro ao criar tabela ${table.name}:`, tableError.message);
                    } else {
                        console.log(`Tabela ${table.name} criada com sucesso!`);
                    }
                } catch (e) {
                    console.error(`Erro ao criar tabela ${table.name}:`, e.message);
                }
            }
        } else {
            console.log('Migração concluída com sucesso!');
        }
    } catch (err) {
        console.error('Erro geral na migração:', err.message);
    }
}

runMigration();
