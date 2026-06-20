-- =====================================================================
-- CONDOSPHERE - ESQUEMA DE BANCO DE DADOS COMPLETO E DEFINITIVO (SQLITE)
-- =====================================================================

-- Ativar verificação de chaves estrangeiras no SQLite
PRAGMA foreign_keys = ON;

-- 1. ACCESS PROFILES TABLE (Perfis de Acesso - RBAC)
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    is_active INTEGER DEFAULT 1,
    permissions TEXT NOT NULL DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. RESIDENCES TABLE (Residências / Lotes)
CREATE TABLE IF NOT EXISTS residences (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL UNIQUE, -- Ex: Quadra A - Lote 05
    owner TEXT NOT NULL,
    address TEXT NOT NULL,
    profile_name TEXT NOT NULL DEFAULT 'Perfil Lote Padrão',
    base_value REAL NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Ativo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. RESIDENTS TABLE (Moradores & Associados)
CREATE TABLE IF NOT EXISTS residents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    contact TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Morador',
    is_associated INTEGER DEFAULT 0,
    is_resident INTEGER DEFAULT 1,
    residence_name TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. EMPLOYEES TABLE (Cadastro de Funcionários CLT)
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cpf TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    salary REAL NOT NULL DEFAULT 0.00,
    advance REAL DEFAULT 0.00,
    earnings TEXT NOT NULL DEFAULT '[]', -- rendimentos/benefícios CLT dinâmicos
    admission_date TEXT NOT NULL,
    contact TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. SYSTEM USERS TABLE (Contas de Acesso com Relacionamentos)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    profile_id TEXT REFERENCES profiles(id) ON DELETE SET NULL,
    phone TEXT,
    cpf TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    resident_id TEXT REFERENCES residents(id) ON DELETE SET NULL,
    employee_id TEXT REFERENCES employees(id) ON DELETE SET NULL
);

-- 6. VEHICLES TABLE (Controle de Placas de Veículos)
CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    plate TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    color TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. COMMON_AREAS TABLE (Áreas Comuns do Condomínio)
CREATE TABLE IF NOT EXISTS common_areas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    capacity INTEGER NOT NULL DEFAULT 50,
    cleaning_fee REAL NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Disponível',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. RESERVATIONS TABLE (Reservas de Áreas Comuns)
CREATE TABLE IF NOT EXISTS reservations (
    id TEXT PRIMARY KEY,
    area_id TEXT REFERENCES common_areas(id) ON DELETE CASCADE,
    area_name TEXT NOT NULL,
    resident_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time_period TEXT NOT NULL,
    fee REAL NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'Aprovada',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. PORTARIA_LOGS TABLE (Controle de Acessos da Portaria)
CREATE TABLE IF NOT EXISTS portaria_logs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    doc TEXT NOT NULL,
    type TEXT NOT NULL, -- Visitante, Prestador, etc.
    vehicle_plate TEXT,
    authorized_by TEXT,
    action TEXT NOT NULL DEFAULT 'Entrada', -- Entrada, Saída
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. PAYABLES TABLE (Contas a Pagar / Despesas)
CREATE TABLE IF NOT EXISTS payables (
    id TEXT PRIMARY KEY,
    creditor TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    category TEXT NOT NULL,
    value REAL NOT NULL DEFAULT 0.00,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    recurrence TEXT DEFAULT 'Única',
    payment_method TEXT,
    payment_date TEXT,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. RECEIVABLES TABLE (Contas a Receber / Faturamento)
CREATE TABLE IF NOT EXISTS receivables (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    due_date TEXT NOT NULL,
    delay_days INTEGER DEFAULT 0,
    base_value REAL NOT NULL DEFAULT 0.00,
    extra_fees REAL DEFAULT 0.00,
    agreed_discounts REAL DEFAULT 0.00,
    status TEXT DEFAULT 'Pendente',
    cancellation_justification TEXT,
    charge_type TEXT DEFAULT 'Ordinária',
    payment_method TEXT,
    payment_date TEXT,
    notes TEXT,
    reference_month TEXT,
    is_write_off INTEGER DEFAULT 0,
    write_off_date TEXT,
    write_off_reason TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11b. FINANCIAL CONFIG TABLE (Regras financeiras configuráveis)
CREATE TABLE IF NOT EXISTS financial_config (
    id TEXT PRIMARY KEY DEFAULT 'main',
    fine_rate REAL DEFAULT 2.0,
    interest_rate REAL DEFAULT 1.0,
    discount_3m REAL DEFAULT 5.0,
    discount_6m REAL DEFAULT 10.0,
    discount_12m REAL DEFAULT 15.0,
    due_day INTEGER DEFAULT 10,
    late_fee_max_days INTEGER DEFAULT 30,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

INSERT OR IGNORE INTO financial_config (id) VALUES ('main');

-- 12. PROVIDERS TABLE (Contratos de Prestadores de Serviço)
CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    company TEXT NOT NULL,
    cnpj TEXT NOT NULL UNIQUE,
    service TEXT NOT NULL,
    contract_value REAL NOT NULL DEFAULT 0.00,
    status TEXT DEFAULT 'Ativo',
    contact TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. ASSEMBLIES TABLE (Assembleias Virtuais)
CREATE TABLE IF NOT EXISTS assemblies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    proposals TEXT NOT NULL DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 14. COMPANY_SETTINGS TABLE (Dados da Empresa)
CREATE TABLE IF NOT EXISTS company_settings (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cnpj TEXT NOT NULL,
    inscricao_estadual TEXT,
    endereco TEXT,
    responsavel_legal TEXT,
    telefone TEXT,
    logo_base64 TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- =====================================================================
-- SEED DE DADOS INICIAIS DO SISTEMA
-- =====================================================================

-- Inserir Perfis de Acesso Seguros (RBAC)
INSERT OR IGNORE INTO profiles (id, name, is_active, permissions) VALUES
('prof-1', 'Administrador', 1, '{"Dashboard": true, "Condomínio": true, "Financeiro": true, "Portaria": true, "RH & Pessoal": true, "Comunicação": true, "Configurações": true}'),
('prof-2', 'Colaborador', 1, '{"Dashboard": true, "Condomínio": true, "Financeiro": false, "Portaria": true, "RH & Pessoal": true, "Comunicação": true, "Configurações": false}'),
('prof-3', 'Morador', 1, '{"Dashboard": true, "Condomínio": true, "Financeiro": false, "Portaria": false, "RH & Pessoal": true, "Comunicação": true, "Configurações": false}'),
('prof-4', 'Portaria', 1, '{"Dashboard": true, "Condomínio": true, "Financeiro": false, "Portaria": true, "RH & Pessoal": false, "Comunicação": true, "Configurações": false}');

-- Inserir Administrador Inicial Único de Produção
INSERT OR IGNORE INTO users (id, full_name, username, email, profile_id, cpf, is_active, created_at) VALUES
(
    'ee476d36-f722-4772-abd9-c2d1735d9ae4',
    'Administrador Geral', 
    'administrador', 
    'admin@condosphere.com', 
    'prof-1', 
    'AdminMaster', 
    1,
    CURRENT_TIMESTAMP
);


-- =====================================================================
-- NOVAS TABELAS: OUVIDORIA, DELIVERIES, NOTIFICATIONS, BANK
-- =====================================================================

-- 15. OUVIDORIA_TICKETS (Chamados / Solicitações / Reclamações)
CREATE TABLE IF NOT EXISTS ouvidoria_tickets (
    id TEXT PRIMARY KEY,
    unit_identifier TEXT NOT NULL,
    resident_name TEXT NOT NULL,
    contact TEXT,
    category TEXT NOT NULL DEFAULT 'Outros',
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Media',
    status TEXT NOT NULL DEFAULT 'Aberto',
    assigned_to TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed_at TEXT
);

-- 16. OUVIDORIA_MESSAGES (Histórico de cada chamado)
CREATE TABLE IF NOT EXISTS ouvidoria_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES ouvidoria_tickets(id) ON DELETE CASCADE,
    author TEXT NOT NULL,
    message TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 17. DELIVERIES (Encomendas / Entregas)
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    resident_name TEXT NOT NULL,
    unit_identifier TEXT NOT NULL,
    carrier TEXT NOT NULL,
    tracking_code TEXT,
    description TEXT NOT NULL,
    received_by TEXT,
    received_at TEXT,
    delivery_status TEXT NOT NULL DEFAULT 'Aguardando',
    notified INTEGER DEFAULT 0,
    pickup_code TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 18. NOTIFICATION_TEMPLATES (Modelos de Mensagem)
CREATE TABLE IF NOT EXISTS notification_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    variables TEXT NOT NULL DEFAULT '[]',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 19. NOTIFICATION_QUEUE (Fila de Disparo)
CREATE TABLE IF NOT EXISTS notification_queue (
    id TEXT PRIMARY KEY,
    template_id TEXT REFERENCES notification_templates(id),
    recipient TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'whatsapp',
    variables_json TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    sent_at TEXT,
    error_message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 20. BANK_ACCOUNTS (Contas Bancárias do Condomínio)
CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    agency TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_type TEXT NOT NULL DEFAULT 'Corrente',
    pix_key TEXT,
    pix_key_type TEXT,
    balance REAL DEFAULT 0.00,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 21. RECONCILIATION_IMPORTS (Importações CNAB/OFX)
CREATE TABLE IF NOT EXISTS reconciliation_imports (
    id TEXT PRIMARY KEY,
    bank_account_id TEXT REFERENCES bank_accounts(id),
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'CNAB240',
    total_transactions INTEGER DEFAULT 0,
    total_value REAL DEFAULT 0.00,
    matched INTEGER DEFAULT 0,
    unmatched INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'imported',
    imported_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 22. RECONCILIATION_ITEMS (Transações individuais importadas)
CREATE TABLE IF NOT EXISTS reconciliation_items (
    id TEXT PRIMARY KEY,
    import_id TEXT REFERENCES reconciliation_imports(id) ON DELETE CASCADE,
    transaction_date TEXT NOT NULL,
    description TEXT,
    document_number TEXT,
    value REAL NOT NULL,
    type TEXT NOT NULL DEFAULT 'credit',
    matched_receivable_id TEXT REFERENCES receivables(id),
    match_status TEXT NOT NULL DEFAULT 'unmatched',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- =====================================================================
-- SEED DE TEMPLATES DE NOTIFICAÇÃO
-- =====================================================================

INSERT OR IGNORE INTO notification_templates (id, name, channel, title, body, variables) VALUES
('nt-vencimento', 'Lembrete de Vencimento', 'whatsapp', '🔔 Lembrete de Pagamento', 'Olá {{residente}}! Sua mensalidade do condomínio referente a {{mes}} vence no dia {{vencimento}}. Evite juros e mantenha-se em dia! 💰', '["residente", "mes", "vencimento"]'),
('nt-atraso', 'Aviso de Atraso', 'whatsapp', '⚠️ Pagamento em Atraso', 'Prezado(a) {{residente}}, identificamos que sua mensalidade de {{mes}} no valor de R$ {{valor}} está vencida há {{dias}} dias. Regularize para evitar multas e negativação.', '["residente", "mes", "valor", "dias"]'),
('nt-confirmacao', 'Confirmação de Pagamento', 'whatsapp', '✅ Pagamento Confirmado', 'Olá {{residente}}! Seu pagamento de R$ {{valor}} referente a {{mes}} foi confirmado com sucesso. Obrigado! 🎉', '["residente", "valor", "mes"]'),
('nt-reserva', 'Confirmação de Reserva', 'whatsapp', '📅 Reserva Confirmada', 'Olá {{residente}}! Sua reserva do(a) {{area}} para o dia {{data}} no período {{periodo}} foi confirmada.', '["residente", "area", "data", "periodo"]'),
('nt-entrega', 'Encomenda Recebida', 'whatsapp', '📦 Encomenda Chegou!', 'Olá {{residente}}! Recebemos uma encomenda da {{transportadora}} para você. Código de retirada: {{codigo}}. Retire na portaria.', '["residente", "transportadora", "codigo"]'),
('nt-chamado', 'Atualização de Chamado', 'whatsapp', '🆕 Chamado Atualizado', 'Olá {{residente}}! Seu chamado "{{assunto}}" foi atualizado para: {{status}}. Acompanhe na portaria.', '["residente", "assunto", "status"]'),
('nt-assembleia', 'Nova Assembleia', 'whatsapp', '🗳️ Assembleia Virtual', 'Olá {{residente}}! Foi aberta a assembleia "{{titulo}}" até {{data}}. Participe e vote nas propostas!', '["residente", "titulo", "data"]');


-- =====================================================================
-- TRIGGERS DE INTEGRAÇÃO FINANCEIRA AUTOMÁTICA
-- =====================================================================

-- 1. Trigger para faturamento automático de Residência cadastrada
CREATE TRIGGER IF NOT EXISTS trigger_new_residence_receivable
AFTER INSERT ON residences
FOR EACH ROW
BEGIN
    INSERT INTO receivables (
        id,
        identifier,
        owner_name,
        due_date,
        base_value,
        extra_fees,
        status,
        charge_type,
        reference_month,
        created_at
    ) VALUES (
        (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr(lower(hex(randomblob(2))),1,1) || substr(lower(hex(randomblob(2))),2,3) || '-' || lower(hex(randomblob(6)))),
        NEW.identifier,
        NEW.owner,
        date(format('%04d-%02d-%02d', 
            CASE WHEN cast(strftime('%d', 'now') as integer) < (SELECT COALESCE(due_day, 10) FROM financial_config WHERE id = 'main')
                 THEN strftime('%Y', 'now')
                 ELSE strftime('%Y', 'now', '+1 month')
            END,
            CASE WHEN cast(strftime('%d', 'now') as integer) < (SELECT COALESCE(due_day, 10) FROM financial_config WHERE id = 'main')
                 THEN strftime('%m', 'now')
                 ELSE CASE WHEN cast(strftime('%m', 'now') as integer) = 12 THEN 1 ELSE cast(strftime('%m', 'now') as integer) + 1 END
            END,
            (SELECT COALESCE(due_day, 10) FROM financial_config WHERE id = 'main')
        )),
        NEW.base_value,
        0.00,
        'Pendente',
        'Ordinária',
            strftime('%Y-%m', 'now'),
        CURRENT_TIMESTAMP
    );
END;

CREATE TABLE IF NOT EXISTS payment_cancellations (
    id TEXT PRIMARY KEY,
    receivable_id TEXT NOT NULL,
    original_value REAL NOT NULL,
    refund_value REAL NOT NULL DEFAULT 0.00,
    cancellation_type TEXT NOT NULL DEFAULT 'cancelamento',
    reason TEXT NOT NULL,
    refund_method TEXT,
    original_payment_method TEXT,
    original_payment_date TEXT,
    status TEXT NOT NULL DEFAULT 'Pendente',
    approved_by TEXT,
    approved_at TEXT,
    executed_at TEXT,
    notes TEXT,
    created_by TEXT DEFAULT 'Administrador',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
);


