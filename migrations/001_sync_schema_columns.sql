-- =====================================================================
-- MIGRAÇÃO: Sincronização de colunas entre schemas (SQLite <-> PostgreSQL)
-- Execute este SQL no Supabase SQL Editor: https://supabase.com/dashboard
-- =====================================================================

-- 1. PORTARIA_LOGS: Renomear colunas para alinhar com SQLite/HTML prototype
--    (Apenas execute se as colunas antigas existirem)

-- Verificar e renomear doc_identifier -> doc
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portaria_logs' AND column_name = 'doc_identifier') THEN
        ALTER TABLE public.portaria_logs RENAME COLUMN doc_identifier TO doc;
    END IF;
END $$;

-- Verificar e renomear access_type -> type
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portaria_logs' AND column_name = 'access_type') THEN
        ALTER TABLE public.portaria_logs RENAME COLUMN access_type TO type;
    END IF;
END $$;

-- Verificar e renomear vehicle_info -> vehicle_plate
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portaria_logs' AND column_name = 'vehicle_info') THEN
        ALTER TABLE public.portaria_logs RENAME COLUMN vehicle_info TO vehicle_plate;
    END IF;
END $$;

-- Verificar e renomear authorizer_info -> authorized_by
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portaria_logs' AND column_name = 'authorizer_info') THEN
        ALTER TABLE public.portaria_logs RENAME COLUMN authorizer_info TO authorized_by;
    END IF;
END $$;

-- Adicionar coluna action se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portaria_logs' AND column_name = 'action') THEN
        ALTER TABLE public.portaria_logs ADD COLUMN action VARCHAR(50) DEFAULT 'Entrada';
    END IF;
END $$;

-- Remover coluna observations se existir (não usada no HTML prototype)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portaria_logs' AND column_name = 'observations') THEN
        ALTER TABLE public.portaria_logs DROP COLUMN observations;
    END IF;
END $$;


-- 2. PROVIDERS: Adicionar coluna contact se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'contact') THEN
        ALTER TABLE public.providers ADD COLUMN contact VARCHAR(100);
    END IF;
END $$;


-- 3. VEHICLES: Verificar se coluna owner_name existe (deveria ser owner_name, não owner)
--    O schema original usava 'owner_name', verificar se está correto
DO $$
BEGIN
    -- Se existir coluna 'owner' mas não 'owner_name', renomear
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'owner_name') THEN
        ALTER TABLE public.vehicles RENAME COLUMN owner TO owner_name;
    END IF;
END $$;


-- 4. ASSEMBLIES: Verificar se coluna 'theme' existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assemblies' AND column_name = 'theme') THEN
        ALTER TABLE public.assemblies ADD COLUMN theme VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
END $$;


-- =====================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('portaria_logs', 'providers', 'vehicles', 'assemblies')
ORDER BY table_name, ordinal_position;
