-- Migration: 20260620014900
-- Descrição: Criar tabelas iniciais para o sistema de condomínio

-- gen_random_uuid() é nativo do Postgres 13+

-- Tabela de Condomínios
CREATE TABLE IF NOT EXISTS condominios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Unidades (apartamentos, salas, etc.)
CREATE TABLE IF NOT EXISTS unidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  bloco TEXT,
  numero TEXT NOT NULL,
  andar INTEGER,
  proprietario TEXT,
  telefone_proprietario TEXT,
  email_proprietario TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(condominio_id, bloco, numero)
);

-- Tabela de Usuários (moradores, síndicos, porteiro, etc.)
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telefone TEXT,
  cpf TEXT UNIQUE,
  tipo_usuario TEXT NOT NULL DEFAULT 'morador' CHECK (tipo_usuario IN ('sindico', 'administrador', 'morador', 'porteiro', 'visitante')),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Usuários por Unidade (relação N:N)
CREATE TABLE IF NOT EXISTS usuarios_por_unidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  papel TEXT DEFAULT 'morador' CHECK (papel IN ('proprietario', 'morador', 'inquilino', 'dependente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, unidade_id)
);

-- Tabela de Veículos
CREATE TABLE IF NOT EXISTS veiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  placa TEXT NOT NULL,
  modelo TEXT,
  cor TEXT,
  marca TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(placa)
);

-- Tabela de Pets
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('cachorro', 'gato', 'outro')),
  raca TEXT,
  porte TEXT CHECK (porte IN ('pequeno', 'medio', 'grande')),
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Comunicados
CREATE TABLE IF NOT EXISTS comunicados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  autor TEXT,
  data_inicio TIMESTAMPTZ DEFAULT NOW(),
  data_fim TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Reservas de Áreas Comuns
CREATE TABLE IF NOT EXISTS reservas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  condominio_id UUID NOT NULL REFERENCES condominios(id) ON DELETE CASCADE,
  unidade_id UUID NOT NULL REFERENCES unidades(id) ON DELETE CASCADE,
  area_comum TEXT NOT NULL,
  data_reserva DATE NOT NULL,
  hora_inicio TIME,
  hora_fim TIME,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmada', 'cancelada', 'concluida')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(condominio_id, area_comum, data_reserva, hora_inicio)
);

-- RLS Policies
ALTER TABLE condominios ENABLE ROW LEVEL SECURITY;
ALTER TABLE unidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_por_unidade ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicados ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para desenvolvimento (ajuste em produção)
CREATE POLICY "allow_all_condominios" ON condominios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_unidades" ON unidades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_usuarios" ON usuarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_usuarios_por_unidade" ON usuarios_por_unidade FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_veiculos" ON veiculos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_pets" ON pets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_comunicados" ON comunicados FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notificacoes" ON notificacoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_reservas" ON reservas FOR ALL USING (true) WITH CHECK (true);
