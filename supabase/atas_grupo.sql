-- ============================================================
-- Módulo de Atas de Reunião de Grupo — CSA Liberdade
-- Executar no SQL Editor do Supabase com role postgres
-- ============================================================

-- 1. Campo grupo_de_escolha na tabela usuarios
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS grupo_de_escolha UUID
REFERENCES grupos(id) ON DELETE SET NULL;

-- 2. Tabela principal de atas
CREATE TABLE IF NOT EXISTS atas_grupo (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grupo_id          UUID NOT NULL REFERENCES grupos(id)
                    ON DELETE CASCADE,
  numero_reuniao    INTEGER NOT NULL,
  data_reuniao      DATE NOT NULL,
  tipo_reuniao      VARCHAR(10) NOT NULL
                    CHECK (tipo_reuniao IN ('aberta','fechada')),
  secretario        VARCHAR(150) NOT NULL,
  coordenador       VARCHAR(150) NOT NULL,
  literatura_lida   TEXT,
  observacoes       TEXT,
  -- Tesouraria
  saldo_anterior    DECIMAL(10,2) NOT NULL DEFAULT 0,
  setima_tradicao   DECIMAL(10,2) NOT NULL DEFAULT 0,
  vendas            DECIMAL(10,2) NOT NULL DEFAULT 0,
  despesas          DECIMAL(10,2) NOT NULL DEFAULT 0,
  saldo_atual       DECIMAL(10,2) GENERATED ALWAYS AS
    (saldo_anterior + setima_tradicao + vendas - despesas)
    STORED,
  -- Encargos (snapshot da ata, não referência dinâmica)
  encargo_rsg           VARCHAR(150),
  encargo_rsg_suplente  VARCHAR(150),
  encargo_secretario    VARCHAR(150),
  encargo_tesoureiro    VARCHAR(150),
  encargo_bem_estar     VARCHAR(150),
  -- Metadados
  criado_por        UUID REFERENCES usuarios(id),
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Presenças de membros
CREATE TABLE IF NOT EXISTS ata_presencas (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ata_id      UUID NOT NULL REFERENCES atas_grupo(id)
              ON DELETE CASCADE,
  numero      INTEGER NOT NULL,
  nome        VARCHAR(150) NOT NULL,
  visitante   BOOLEAN NOT NULL DEFAULT FALSE
);

-- 4. Ingressos
CREATE TABLE IF NOT EXISTS ata_ingressos (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ata_id          UUID NOT NULL REFERENCES atas_grupo(id)
                  ON DELETE CASCADE,
  nome_ingresso   VARCHAR(150) NOT NULL,
  nome_padrinho   VARCHAR(150) NOT NULL,
  como_conheceu   VARCHAR(300)
);

-- 5. Trocas de ficha
CREATE TABLE IF NOT EXISTS ata_trocas_ficha (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ata_id        UUID NOT NULL REFERENCES atas_grupo(id)
                ON DELETE CASCADE,
  nome_membro   VARCHAR(150) NOT NULL,
  ficha         VARCHAR(100) NOT NULL,
  nome_padrinho VARCHAR(150) NOT NULL
);

-- RLS
ALTER TABLE atas_grupo       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ata_presencas    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ata_ingressos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ata_trocas_ficha ENABLE ROW LEVEL SECURITY;

-- Leitura pública para todos
CREATE POLICY "publico_le_atas_grupo"
  ON atas_grupo FOR SELECT USING (true);
CREATE POLICY "publico_le_presencas"
  ON ata_presencas FOR SELECT USING (true);
CREATE POLICY "publico_le_ingressos"
  ON ata_ingressos FOR SELECT USING (true);
CREATE POLICY "publico_le_trocas"
  ON ata_trocas_ficha FOR SELECT USING (true);

-- Escrita apenas para autenticados
CREATE POLICY "auth_escreve_atas"
  ON atas_grupo FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "auth_escreve_presencas"
  ON ata_presencas FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "auth_escreve_ingressos"
  ON ata_ingressos FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
CREATE POLICY "auth_escreve_trocas"
  ON ata_trocas_ficha FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Índices
CREATE INDEX IF NOT EXISTS idx_atas_grupo_grupo_id
  ON atas_grupo(grupo_id);
CREATE INDEX IF NOT EXISTS idx_atas_grupo_data
  ON atas_grupo(data_reuniao DESC);
CREATE INDEX IF NOT EXISTS idx_ata_presencas_ata
  ON ata_presencas(ata_id);
CREATE INDEX IF NOT EXISTS idx_ata_ingressos_ata
  ON ata_ingressos(ata_id);
CREATE INDEX IF NOT EXISTS idx_ata_trocas_ata
  ON ata_trocas_ficha(ata_id);
