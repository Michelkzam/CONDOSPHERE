-- =====================================================================
-- CONDOSPHERE - ESQUEMA DE BANCO DE DADOS COMPLETO E DEFINITIVO (SINGLE-TENANT)
-- =====================================================================

-- Ativar extensão de UUID de forma segura
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACCESS PROFILES TABLE (Perfis de Acesso - RBAC)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.profiles;
CREATE POLICY "Allow public write access" ON public.profiles FOR ALL USING (true) WITH CHECK (true);


-- 2. RESIDENCES TABLE (Residências / Lotes)
CREATE TABLE IF NOT EXISTS public.residences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(150) NOT NULL UNIQUE, -- Ex: Quadra A - Lote 05
    owner VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    profile_name VARCHAR(150) NOT NULL DEFAULT 'Perfil Lote Padrão',
    base_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.residences DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.residences;
CREATE POLICY "Allow public write access" ON public.residences FOR ALL USING (true) WITH CHECK (true);


-- 3. RESIDENTS TABLE (Moradores & Associados)
CREATE TABLE IF NOT EXISTS public.residents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    contact VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'Morador',
    is_associated BOOLEAN DEFAULT false,
    is_resident BOOLEAN DEFAULT true,
    residence_name VARCHAR(150),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.residents DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.residents;
CREATE POLICY "Allow public write access" ON public.residents FOR ALL USING (true) WITH CHECK (true);


-- 4. EMPLOYEES TABLE (Cadastro de Funcionários CLT)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    role VARCHAR(150) NOT NULL,
    salary DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    advance DECIMAL(12,2) DEFAULT 0.00,
    earnings JSONB NOT NULL DEFAULT '[]'::jsonb, -- rendimentos/benefícios CLT dinâmicos
    admission_date DATE NOT NULL,
    contact VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.employees;
CREATE POLICY "Allow public write access" ON public.employees FOR ALL USING (true) WITH CHECK (true);


-- 5. SYSTEM USERS TABLE (Contas de Acesso com Relacionamentos)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    phone VARCHAR(100),
    cpf VARCHAR(14),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    resident_id UUID REFERENCES public.residents(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL
);

ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.users;
CREATE POLICY "Allow public write access" ON public.users FOR ALL USING (true) WITH CHECK (true);


-- 6. VEHICLES TABLE (Controle de Placas de Veículos)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plate VARCHAR(20) NOT NULL UNIQUE,
    model VARCHAR(150) NOT NULL,
    color VARCHAR(100) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.vehicles;
CREATE POLICY "Allow public write access" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);


-- 7. COMMON AREAS TABLE (Áreas Comuns)
CREATE TABLE IF NOT EXISTS public.common_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 50,
    cleaning_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Livre',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.common_areas DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.common_areas;
CREATE POLICY "Allow public write access" ON public.common_areas FOR ALL USING (true) WITH CHECK (true);


-- 8. RESERVATIONS TABLE (Agenda de Reservas)
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area_id UUID REFERENCES public.common_areas(id) ON DELETE CASCADE,
    area_name VARCHAR(255) NOT NULL,
    resident_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    time_period VARCHAR(100) DEFAULT 'O dia todo',
    fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Confirmado',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reservations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.reservations;
CREATE POLICY "Allow public write access" ON public.reservations FOR ALL USING (true) WITH CHECK (true);


-- 9. PORTARIA LOGS TABLE (Histórico de Acessos)
CREATE TABLE IF NOT EXISTS public.portaria_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    doc_identifier VARCHAR(100) NOT NULL,
    access_type VARCHAR(100) NOT NULL DEFAULT 'Visitante',
    vehicle_info VARCHAR(255),
    authorizer_info VARCHAR(255) NOT NULL,
    observations TEXT,
    photo_doc TEXT,
    photo_person TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.portaria_logs DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.portaria_logs;
CREATE POLICY "Allow public write access" ON public.portaria_logs FOR ALL USING (true) WITH CHECK (true);


-- 10. PAYABLES TABLE (Contas a Pagar / Despesas)
CREATE TABLE IF NOT EXISTS public.payables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creditor VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date DATE NOT NULL,
    category VARCHAR(150) NOT NULL,
    value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pendente',
    recurrence VARCHAR(50) DEFAULT 'Única',
    payment_method VARCHAR(50),
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payables DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.payables;
CREATE POLICY "Allow public write access" ON public.payables FOR ALL USING (true) WITH CHECK (true);


-- 11. RECEIVABLES TABLE (Contas a Receber / Faturamento)
CREATE TABLE IF NOT EXISTS public.receivables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    delay_days INTEGER DEFAULT 0,
    base_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    extra_fees DECIMAL(12,2) DEFAULT 0.00,
    agreed_discounts DECIMAL(12,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pendente',
    cancellation_justification TEXT,
    charge_type VARCHAR(50) DEFAULT 'Ordinária',
    payment_method VARCHAR(50),
    payment_date DATE,
    notes TEXT,
    reference_month VARCHAR(7),
    is_write_off BOOLEAN DEFAULT false,
    write_off_date DATE,
    write_off_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.receivables DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.receivables;
CREATE POLICY "Allow public write access" ON public.receivables FOR ALL USING (true) WITH CHECK (true);


-- 12. PROVIDERS TABLE (Contratos de Prestadores de Serviço)
CREATE TABLE IF NOT EXISTS public.providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) NOT NULL UNIQUE,
    service VARCHAR(255) NOT NULL,
    contract_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Ativo',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.providers;
CREATE POLICY "Allow public write access" ON public.providers FOR ALL USING (true) WITH CHECK (true);


-- 13. ASSEMBLIES TABLE (Assembleias & Votações Virtuais)
CREATE TABLE IF NOT EXISTS public.assemblies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    theme VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    proposals JSONB NOT NULL DEFAULT '[]'::jsonb, -- list of proposals/pautas and their vote counts
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assemblies DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.assemblies;
CREATE POLICY "Allow public write access" ON public.assemblies FOR ALL USING (true) WITH CHECK (true);


-- 15. FINANCIAL CONFIG TABLE (Regras financeiras configuráveis)
CREATE TABLE IF NOT EXISTS public.financial_config (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'main',
    fine_rate DECIMAL(5,2) DEFAULT 2.0,
    interest_rate DECIMAL(5,2) DEFAULT 1.0,
    discount_3m DECIMAL(5,2) DEFAULT 5.0,
    discount_6m DECIMAL(5,2) DEFAULT 10.0,
    discount_12m DECIMAL(5,2) DEFAULT 15.0,
    due_day INTEGER DEFAULT 10,
    late_fee_max_days INTEGER DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_config DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.financial_config;
CREATE POLICY "Allow public write access" ON public.financial_config FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.financial_config (id) VALUES ('main') ON CONFLICT (id) DO NOTHING;

-- 14. COMPANY SETTINGS TABLE (Dados da Empresa / Identidade Visual)
CREATE TABLE IF NOT EXISTS public.company_settings (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'main',
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(150) NOT NULL,
    cnpj VARCHAR(20) NOT NULL,
    inscricao_estadual VARCHAR(50),
    endereco TEXT,
    responsavel_legal VARCHAR(255),
    telefone VARCHAR(100),
    logo_base64 TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.company_settings;
CREATE POLICY "Allow public write access" ON public.company_settings FOR ALL USING (true) WITH CHECK (true);


-- ==========================================
-- SEED DE DADOS INICIAIS DO SISTEMA
-- ==========================================

-- Inserir Perfis de Acesso Seguros (RBAC)
INSERT INTO public.profiles (name, is_active, permissions) VALUES
('Administrador', true, '{"Dashboard": true, "Condomínio": true, "Financeiro": true, "Portaria": true, "RH & Pessoal": true, "Comunicação": true, "Configurações": true}'),
('Colaborador', true, '{"Dashboard": true, "Condomínio": true, "Financeiro": false, "Portaria": true, "RH & Pessoal": true, "Comunicação": true, "Configurações": false}'),
('Morador', true, '{"Dashboard": true, "Condomínio": true, "Financeiro": false, "Portaria": false, "RH & Pessoal": true, "Comunicação": true, "Configurações": false}'),
('Portaria', true, '{"Dashboard": true, "Condomínio": true, "Financeiro": false, "Portaria": true, "RH & Pessoal": false, "Comunicação": true, "Configurações": false}')
ON CONFLICT (name) DO NOTHING;

-- Inserir Administrador Inicial Único de Produção
INSERT INTO public.users (full_name, username, email, profile_id, cpf, is_active) VALUES
(
    'Administrador Geral', 
    'administrador', 
    'admin@condosphere.com', 
    (SELECT id FROM public.profiles WHERE name = 'Administrador' LIMIT 1), 
    'AdminMaster', 
    true
)
ON CONFLICT (username) DO NOTHING;


-- ==========================================
-- NOVAS TABELAS: OUVIDORIA, DELIVERIES, NOTIFICATIONS, BANK
-- ==========================================

-- 15. OUVIDORIA_TICKETS (Chamados / Solicitações / Reclamações)
CREATE TABLE IF NOT EXISTS public.ouvidoria_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_identifier VARCHAR(150) NOT NULL,
    resident_name VARCHAR(255) NOT NULL,
    contact VARCHAR(100),
    category VARCHAR(100) NOT NULL DEFAULT 'Outros',
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'Media',
    status VARCHAR(50) NOT NULL DEFAULT 'Aberto',
    assigned_to VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMPTZ
);

ALTER TABLE public.ouvidoria_tickets DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.ouvidoria_tickets;
CREATE POLICY "Allow public write access" ON public.ouvidoria_tickets FOR ALL USING (true) WITH CHECK (true);

-- 16. OUVIDORIA_MESSAGES (Histórico de cada chamado)
CREATE TABLE IF NOT EXISTS public.ouvidoria_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.ouvidoria_tickets(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ouvidoria_messages DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.ouvidoria_messages;
CREATE POLICY "Allow public write access" ON public.ouvidoria_messages FOR ALL USING (true) WITH CHECK (true);

-- 17. DELIVERIES (Encomendas / Entregas)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resident_name VARCHAR(255) NOT NULL,
    unit_identifier VARCHAR(150) NOT NULL,
    carrier VARCHAR(255) NOT NULL,
    tracking_code VARCHAR(255),
    description TEXT NOT NULL,
    received_by VARCHAR(255),
    received_at TIMESTAMPTZ,
    delivery_status VARCHAR(50) NOT NULL DEFAULT 'Aguardando',
    notified BOOLEAN DEFAULT false,
    pickup_code VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.deliveries DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.deliveries;
CREATE POLICY "Allow public write access" ON public.deliveries FOR ALL USING (true) WITH CHECK (true);

-- 18. NOTIFICATION_TEMPLATES (Modelos de Mensagem)
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_templates DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.notification_templates;
CREATE POLICY "Allow public write access" ON public.notification_templates FOR ALL USING (true) WITH CHECK (true);

-- 19. NOTIFICATION_QUEUE (Fila de Disparo)
CREATE TABLE IF NOT EXISTS public.notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES public.notification_templates(id),
    recipient VARCHAR(255) NOT NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'whatsapp',
    variables_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notification_queue DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.notification_queue;
CREATE POLICY "Allow public write access" ON public.notification_queue FOR ALL USING (true) WITH CHECK (true);

-- 20. BANK_ACCOUNTS (Contas Bancárias do Condomínio)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(10) NOT NULL,
    agency VARCHAR(20) NOT NULL,
    account_number VARCHAR(30) NOT NULL,
    account_type VARCHAR(50) NOT NULL DEFAULT 'Corrente',
    pix_key VARCHAR(255),
    pix_key_type VARCHAR(50),
    balance DECIMAL(12,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.bank_accounts DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.bank_accounts;
CREATE POLICY "Allow public write access" ON public.bank_accounts FOR ALL USING (true) WITH CHECK (true);

-- 21. RECONCILIATION_IMPORTS (Importações CNAB/OFX)
CREATE TABLE IF NOT EXISTS public.reconciliation_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES public.bank_accounts(id),
    filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'CNAB240',
    total_transactions INTEGER DEFAULT 0,
    total_value DECIMAL(12,2) DEFAULT 0.00,
    matched INTEGER DEFAULT 0,
    unmatched INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'imported',
    imported_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reconciliation_imports DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.reconciliation_imports;
CREATE POLICY "Allow public write access" ON public.reconciliation_imports FOR ALL USING (true) WITH CHECK (true);

-- 22. RECONCILIATION_ITEMS (Transações individuais importadas)
CREATE TABLE IF NOT EXISTS public.reconciliation_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_id UUID REFERENCES public.reconciliation_imports(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    description TEXT,
    document_number VARCHAR(255),
    value DECIMAL(12,2) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'credit',
    matched_receivable_id UUID REFERENCES public.receivables(id),
    match_status VARCHAR(50) NOT NULL DEFAULT 'unmatched',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.reconciliation_items DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.reconciliation_items;
CREATE POLICY "Allow public write access" ON public.reconciliation_items FOR ALL USING (true) WITH CHECK (true);

-- SEED DE TEMPLATES DE NOTIFICAÇÃO
INSERT INTO public.notification_templates (name, channel, title, body, variables) VALUES
('Lembrete de Vencimento', 'whatsapp', '🔔 Lembrete de Pagamento', 'Olá {{residente}}! Sua mensalidade do condomínio referente a {{mes}} vence no dia {{vencimento}}. Evite juros e mantenha-se em dia! 💰', '["residente", "mes", "vencimento"]'),
('Aviso de Atraso', 'whatsapp', '⚠️ Pagamento em Atraso', 'Prezado(a) {{residente}}, identificamos que sua mensalidade de {{mes}} no valor de R$ {{valor}} está vencida há {{dias}} dias. Regularize para evitar multas e negativação.', '["residente", "mes", "valor", "dias"]'),
('Confirmação de Pagamento', 'whatsapp', '✅ Pagamento Confirmado', 'Olá {{residente}}! Seu pagamento de R$ {{valor}} referente a {{mes}} foi confirmado com sucesso! Obrigado! 🎉', '["residente", "valor", "mes"]'),
('Confirmação de Reserva', 'whatsapp', '📅 Reserva Confirmada', 'Olá {{residente}}! Sua reserva do(a) {{area}} para o dia {{data}} no período {{periodo}} foi confirmada.', '["residente", "area", "data", "periodo"]'),
('Encomenda Recebida', 'whatsapp', '📦 Encomenda Chegou!', 'Olá {{residente}}! Recebemos uma encomenda da {{transportadora}} para você. Código de retirada: {{codigo}}. Retire na portaria.', '["residente", "transportadora", "codigo"]'),
('Atualização de Chamado', 'whatsapp', '🆕 Chamado Atualizado', 'Olá {{residente}}! Seu chamado "{{assunto}}" foi atualizado para: {{status}}. Acompanhe na portaria.', '["residente", "assunto", "status"]'),
('Nova Assembleia', 'whatsapp', '🗳️ Assembleia Virtual', 'Olá {{residente}}! Foi aberta a assembleia "{{titulo}}" até {{data}}. Participe e vote nas propostas!', '["residente", "titulo", "data"]')
ON CONFLICT (name) DO NOTHING;


-- ==========================================
-- TRIGGERS DE INTEGRAÇÃO FINANCEIRA AUTOMÁTICA
-- ==========================================

-- 1. Criar trigger para faturamento automático de Residência cadastrada
CREATE OR REPLACE FUNCTION public.handle_new_residence_receivable()
RETURNS TRIGGER AS $$
DECLARE
    v_due_day INTEGER;
    v_next_month INTEGER;
    v_year INTEGER;
BEGIN
    SELECT COALESCE(due_day, 10) INTO v_due_day FROM public.financial_config WHERE id = 'main';
    
    IF EXTRACT(DAY FROM CURRENT_DATE) < v_due_day THEN
        v_year := EXTRACT(YEAR FROM CURRENT_DATE);
        v_next_month := EXTRACT(MONTH FROM CURRENT_DATE);
    ELSE
        v_next_month := EXTRACT(MONTH FROM CURRENT_DATE) + 1;
        IF v_next_month > 12 THEN
            v_next_month := 1;
            v_year := EXTRACT(YEAR FROM CURRENT_DATE) + 1;
        ELSE
            v_year := EXTRACT(YEAR FROM CURRENT_DATE);
        END IF;
    END IF;

    INSERT INTO public.receivables (
        identifier,
        owner_name,
        due_date,
        base_value,
        extra_fees,
        status,
        charge_type,
        reference_month
    ) VALUES (
        NEW.identifier,
        NEW.owner,
        MAKE_DATE(v_year, v_next_month, v_due_day),
        NEW.base_value,
        0.00,
        'Pendente',
        'Ordinária',
        TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_new_residence_receivable ON public.residences;
CREATE TRIGGER trigger_new_residence_receivable
AFTER INSERT ON public.residences
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_residence_receivable();

CREATE TABLE IF NOT EXISTS public.payment_cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receivable_id UUID NOT NULL,
    original_value DECIMAL(12,2) NOT NULL,
    refund_value DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    cancellation_type VARCHAR(50) NOT NULL DEFAULT 'cancelamento',
    reason TEXT NOT NULL,
    refund_method VARCHAR(50),
    original_payment_method VARCHAR(50),
    original_payment_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
    approved_by VARCHAR(255),
    approved_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    notes TEXT,
    created_by VARCHAR(255) DEFAULT 'Administrador',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payment_cancellations DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public write access" ON public.payment_cancellations;
CREATE POLICY "Allow public write access" ON public.payment_cancellations FOR ALL USING (true) WITH CHECK (true);



