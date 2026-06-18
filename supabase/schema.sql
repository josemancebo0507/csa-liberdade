-- CSA Liberdade — Schema completo
-- Execute este arquivo no SQL Editor do Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- TIPOS ENUMERADOS
CREATE TYPE status_geral       AS ENUM ('ativo', 'inativo');
CREATE TYPE tipo_reuniao       AS ENUM ('aberta', 'fechada');
CREATE TYPE formato_reuniao    AS ENUM ('presencial', 'online', 'hibrida');
CREATE TYPE dia_semana         AS ENUM ('segunda','terca','quarta','quinta','sexta','sabado','domingo');
CREATE TYPE responsavel_evento AS ENUM ('grupo', 'subcomite', 'area');
CREATE TYPE status_evento      AS ENUM ('publicado', 'cancelado');
CREATE TYPE status_encargo     AS ENUM ('ativo', 'vago', 'inativo');
CREATE TYPE tipo_usuario       AS ENUM ('admin', 'chave_grupo', 'chave_subcomite');

-- USUÁRIOS
CREATE TABLE usuarios (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id  UUID UNIQUE NOT NULL,
    nome_servico  VARCHAR(100) NOT NULL,
    tipo          tipo_usuario NOT NULL,
    ativo         BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- GRUPOS
CREATE TABLE grupos (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome          VARCHAR(150) NOT NULL,
    cidade        VARCHAR(100) NOT NULL,
    bairro        VARCHAR(100),
    endereco      TEXT,
    status        status_geral NOT NULL DEFAULT 'ativo',
    observacoes   TEXT,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_grupo (
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    grupo_id   UUID NOT NULL REFERENCES grupos(id)   ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, grupo_id)
);

-- REUNIÕES DE GRUPO
CREATE TABLE reunioes_grupo (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id      UUID NOT NULL REFERENCES grupos(id) ON DELETE CASCADE,
    dia_semana    dia_semana NOT NULL,
    horario       TIME NOT NULL,
    tipo          tipo_reuniao NOT NULL DEFAULT 'aberta',
    formato       formato_reuniao NOT NULL DEFAULT 'presencial',
    endereco_link TEXT,
    status        status_geral NOT NULL DEFAULT 'ativo',
    observacoes   TEXT,
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SUBCOMITÊS
CREATE TABLE subcomites (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome          VARCHAR(150) NOT NULL,
    sigla         VARCHAR(20),
    descricao     TEXT,
    status        status_geral NOT NULL DEFAULT 'ativo',
    criado_em     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usuario_subcomite (
    usuario_id   UUID NOT NULL REFERENCES usuarios(id)   ON DELETE CASCADE,
    subcomite_id UUID NOT NULL REFERENCES subcomites(id) ON DELETE CASCADE,
    PRIMARY KEY (usuario_id, subcomite_id)
);

-- REUNIÕES DE SUBCOMITÊ
CREATE TABLE reunioes_subcomite (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subcomite_id    UUID NOT NULL REFERENCES subcomites(id) ON DELETE CASCADE,
    recorrente      BOOLEAN NOT NULL DEFAULT FALSE,
    dia_semana      dia_semana,
    data_especifica DATE,
    horario         TIME NOT NULL,
    formato         formato_reuniao NOT NULL DEFAULT 'presencial',
    local_link      TEXT,
    status          status_geral NOT NULL DEFAULT 'ativo',
    observacoes     TEXT,
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_reuniao_subcomite_tipo CHECK (
        (recorrente = TRUE  AND dia_semana IS NOT NULL AND data_especifica IS NULL) OR
        (recorrente = FALSE AND data_especifica IS NOT NULL AND dia_semana IS NULL)
    )
);

-- TIPOS DE ENCARGO
CREATE TABLE tipos_encargo (
    id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome  VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- SERVIDORES
CREATE TABLE servidores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_servico    VARCHAR(100) NOT NULL,
    contato         VARCHAR(200),
    contato_publico BOOLEAN NOT NULL DEFAULT FALSE,
    status          status_geral NOT NULL DEFAULT 'ativo',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- VÍNCULOS DE ENCARGO
CREATE TABLE vinculos_encargo (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    servidor_id     UUID NOT NULL REFERENCES servidores(id)    ON DELETE CASCADE,
    tipo_encargo_id UUID NOT NULL REFERENCES tipos_encargo(id),
    grupo_id        UUID REFERENCES grupos(id)     ON DELETE CASCADE,
    subcomite_id    UUID REFERENCES subcomites(id) ON DELETE CASCADE,
    mesa_area       BOOLEAN DEFAULT FALSE,
    data_inicio     DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim        DATE,
    status          status_encargo NOT NULL DEFAULT 'ativo',
    criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_vinculo_contexto CHECK (
        ((grupo_id IS NOT NULL)::INT + (subcomite_id IS NOT NULL)::INT + (mesa_area = TRUE)::INT) = 1
    )
);

-- TIPOS DE EVENTO
CREATE TABLE tipos_evento (
    id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome  VARCHAR(100) NOT NULL UNIQUE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

-- EVENTOS
CREATE TABLE eventos (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    titulo         VARCHAR(200) NOT NULL,
    data_evento    DATE NOT NULL,
    horario        TIME,
    tipo_evento_id UUID NOT NULL REFERENCES tipos_evento(id),
    responsavel    responsavel_evento NOT NULL,
    grupo_id       UUID REFERENCES grupos(id),
    subcomite_id   UUID REFERENCES subcomites(id),
    local_link     TEXT,
    descricao      TEXT,
    link_externo   TEXT,
    status         status_evento NOT NULL DEFAULT 'publicado',
    criado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    atualizado_em  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_evento_responsavel CHECK (
        (responsavel = 'area') OR
        (responsavel = 'grupo'     AND grupo_id     IS NOT NULL AND subcomite_id IS NULL) OR
        (responsavel = 'subcomite' AND subcomite_id IS NOT NULL AND grupo_id     IS NULL)
    )
);

-- ÍNDICES
CREATE INDEX idx_reunioes_grupo_grupo   ON reunioes_grupo(grupo_id);
CREATE INDEX idx_reunioes_grupo_status  ON reunioes_grupo(status);
CREATE INDEX idx_reunioes_sub_sub       ON reunioes_subcomite(subcomite_id);
CREATE INDEX idx_vinculos_servidor      ON vinculos_encargo(servidor_id);
CREATE INDEX idx_vinculos_grupo         ON vinculos_encargo(grupo_id);
CREATE INDEX idx_vinculos_subcomite     ON vinculos_encargo(subcomite_id);
CREATE INDEX idx_eventos_data           ON eventos(data_evento);
CREATE INDEX idx_eventos_status         ON eventos(status);
CREATE INDEX idx_grupos_status          ON grupos(status);
CREATE INDEX idx_subcomites_status      ON subcomites(status);

-- DADOS INICIAIS

INSERT INTO tipos_encargo (nome) VALUES
    ('RSG'), ('RSG Suplente'), ('Secretário'), ('Tesoureiro'),
    ('Bem Estar'), ('ESG'), ('ESG Suplente'),
    ('Coordenador'), ('Vice-Coordenador'), ('Servidor'),
    ('RSA'), ('RSA Suplente'), ('Outro');

INSERT INTO tipos_evento (nome) VALUES
    ('Aniversário de Grupo'), ('Aniversário da Área'), ('Fórum'),
    ('Dia de Aprendizado'), ('Encontro'), ('Temática'),
    ('Workshop'), ('Confraternização'), ('Evento de Unidade'), ('Outro');

INSERT INTO subcomites (nome, sigla, descricao) VALUES
    ('Relações Públicas',       'RP',    'Divulga NA para a comunidade e mídia'),
    ('Hospitais & Instituições','H&I',   'Leva a mensagem a adictos sem acesso às reuniões'),
    ('Longo Alcance',           'LA',    'Apoia grupos e adictos isolados'),
    ('Eventos',                 'EVT',   'Organiza encontros, fóruns e confraternizações'),
    ('Materiais e Literatura',  'ML',    'Distribui literatura e materiais de NA'),
    ('Bem Estar',               'BE',    'Cuida do bem estar dos servidores e membros'),
    ('Construção',              'CONST', 'Infraestrutura e sede'),
    ('Tecnologia',              'TEC',   'Suporte tecnológico da área');

-- RLS (Row Level Security)
ALTER TABLE grupos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes_grupo     ENABLE ROW LEVEL SECURITY;
ALTER TABLE servidores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinculos_encargo   ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcomites         ENABLE ROW LEVEL SECURITY;
ALTER TABLE reunioes_subcomite ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_grupo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuario_subcomite  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_encargo      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipos_evento       ENABLE ROW LEVEL SECURITY;

-- Leitura pública: qualquer pessoa lê registros ativos
CREATE POLICY "publico_le_grupos"      ON grupos      FOR SELECT USING (status = 'ativo');
CREATE POLICY "publico_le_reunioes_g"  ON reunioes_grupo     FOR SELECT USING (status = 'ativo');
CREATE POLICY "publico_le_subcomites"  ON subcomites  FOR SELECT USING (status = 'ativo');
CREATE POLICY "publico_le_reunioes_s"  ON reunioes_subcomite FOR SELECT USING (status = 'ativo');
CREATE POLICY "publico_le_servidores"  ON servidores  FOR SELECT USING (status = 'ativo');
CREATE POLICY "publico_le_vinculos"    ON vinculos_encargo   FOR SELECT USING (status != 'inativo');
CREATE POLICY "publico_le_eventos"     ON eventos     FOR SELECT USING (status = 'publicado');
CREATE POLICY "publico_le_t_encargo"   ON tipos_encargo      FOR SELECT USING (ativo = TRUE);
CREATE POLICY "publico_le_t_evento"    ON tipos_evento       FOR SELECT USING (ativo = TRUE);

-- Admin lê e escreve tudo (via service role key — bypass RLS automático)
-- As operações admin usarão o cliente service_role que ignora RLS

-- Usuário autenticado lê seu próprio perfil
CREATE POLICY "usuario_le_proprio" ON usuarios FOR SELECT
    USING (auth_user_id = auth.uid());
