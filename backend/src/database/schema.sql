-- ============================================================
-- LearnAI — Schema PostgreSQL Completo
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tipos ENUM
CREATE TYPE user_role       AS ENUM ('student', 'admin');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE test_status     AS ENUM ('pending', 'completed');
CREATE TYPE test_type       AS ENUM ('diagnostic', 'progress', 'final');

-- ============================================================
-- USUÁRIOS
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role    NOT NULL DEFAULT 'student',
  avatar_url    TEXT,
  xp            INTEGER      NOT NULL DEFAULT 0,
  level         INTEGER      NOT NULL DEFAULT 1,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TRILHAS DE APRENDIZAGEM
-- ============================================================
CREATE TABLE learning_paths (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  thumbnail   TEXT,
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE topics (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  title            VARCHAR(200) NOT NULL,
  description      TEXT,
  order_index      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE skills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- INSCRIÇÕES
-- ============================================================
CREATE TABLE enrollments (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  UNIQUE(user_id, learning_path_id)
);

-- ============================================================
-- AVALIAÇÕES DIAGNÓSTICAS
-- ============================================================
CREATE TABLE diagnostic_tests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  type             test_type   NOT NULL DEFAULT 'diagnostic',
  status           test_status NOT NULL DEFAULT 'pending',
  ai_raw_response  TEXT,
  score            NUMERIC(5,2),
  level_assigned   difficulty_level,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX idx_tests_user ON diagnostic_tests(user_id, created_at DESC);

CREATE TABLE questions (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_test_id UUID NOT NULL REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
  topic_id           UUID REFERENCES topics(id),
  skill_id           UUID REFERENCES skills(id),
  question_text      TEXT NOT NULL,
  options            JSONB NOT NULL,          -- [{label:"A",text:"..."},...]
  correct_option     VARCHAR(1) NOT NULL,     -- "A","B","C","D"
  difficulty         difficulty_level NOT NULL DEFAULT 'beginner',
  explanation        TEXT,
  order_index        INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE student_answers (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  diagnostic_test_id UUID NOT NULL REFERENCES diagnostic_tests(id) ON DELETE CASCADE,
  question_id        UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  selected_option    VARCHAR(1) NOT NULL,
  is_correct         BOOLEAN     NOT NULL,
  answered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(diagnostic_test_id, question_id, user_id)
);

-- ============================================================
-- PLANOS DE ESTUDO
-- ============================================================
CREATE TABLE study_plans (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_path_id   UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  diagnostic_test_id UUID REFERENCES diagnostic_tests(id),
  content            JSONB NOT NULL,
  goals              TEXT,
  is_active          BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TUTOR IA — HISTÓRICO DE CHAT
-- ============================================================
CREATE TABLE ai_interactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_path_id UUID REFERENCES learning_paths(id),
  topic_id         UUID REFERENCES topics(id),
  role             VARCHAR(20) NOT NULL,  -- 'user' | 'assistant'
  content          TEXT NOT NULL,
  tokens_used      INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_user ON ai_interactions(user_id, created_at DESC);

-- ============================================================
-- GAMIFICAÇÃO
-- ============================================================
CREATE TABLE user_badges (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge     VARCHAR(50) NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge)
);

CREATE TABLE xp_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  xp_gained  INTEGER NOT NULL,
  reason     VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TRIGGER: atualiza updated_at automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated          BEFORE UPDATE ON users          FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_learning_paths_updated BEFORE UPDATE ON learning_paths FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_study_plans_updated    BEFORE UPDATE ON study_plans    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- SEED: admin padrão  (senha: Admin@123)
-- ============================================================
INSERT INTO users (name, email, password_hash, role) VALUES (
  'Administrador',
  'admin@platform.com',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS6JeZW',
  'admin'
);
