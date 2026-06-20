-- Execute no Supabase → SQL Editor
-- Adiciona coordenadas geográficas à tabela de grupos

ALTER TABLE grupos ADD COLUMN IF NOT EXISTS latitude  DECIMAL(10,7);
ALTER TABLE grupos ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
