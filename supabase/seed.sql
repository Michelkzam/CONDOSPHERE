-- Seed: Dados iniciais
-- Condomínios de exemplo
INSERT INTO condominios (nome, cnpj, endereco, telefone, email) VALUES
('Condomínio Resencial Sol Nascente', '12.345.678/0001-90', 'Rua das Flores, 123 - Centro', '(11) 99999-1234', 'contato@solnascente.com'),
('Condomínio Empresarial Horizonte', '98.765.432/0001-10', 'Av. Paulista, 1000 - Bela Vista', '(11) 88888-5678', 'admin@horizonte.com');

-- Unidades de exemplo
INSERT INTO unidades (condominio_id, bloco, numero, andar, proprietario, telefone_proprietario, email_proprietario) VALUES
-- Sol Nascente
((SELECT id FROM condominios WHERE cnpj = '12.345.678/0001-90'), 'A', '101', 1, 'João Silva', '(11) 91111-1111', 'joao@email.com'),
((SELECT id FROM condominios WHERE cnpj = '12.345.678/0001-90'), 'A', '102', 1, 'Maria Santos', '(11) 92222-2222', 'maria@email.com'),
((SELECT id FROM condominios WHERE cnpj = '12.345.678/0001-90'), 'A', '201', 2, 'Pedro Oliveira', '(11) 93333-3333', 'pedro@email.com'),
((SELECT id FROM condominios WHERE cnpj = '12.345.678/0001-90'), 'B', '101', 1, 'Ana Costa', '(11) 94444-4444', 'ana@email.com'),
((SELECT id FROM condominios WHERE cnpj = '12.345.678/0001-90'), 'B', '201', 2, 'Carlos Pereira', '(11) 95555-5555', 'carlos@email.com'),
-- Horizonte
((SELECT id FROM condominios WHERE cnpj = '98.765.432/0001-10'), NULL, '101', 1, 'Lucia Ferreira', '(11) 96666-6666', 'lucia@email.com'),
((SELECT id FROM condominios WHERE cnpj = '98.765.432/0001-10'), NULL, '201', 2, 'Roberto Almeida', '(11) 97777-7777', 'roberto@email.com');
