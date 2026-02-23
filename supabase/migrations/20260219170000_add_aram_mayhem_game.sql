-- Add 증바람 (무작위 총력전: 아수라장 / ARAM Mayhem) to games table
INSERT INTO games (slug, name) VALUES ('aram-mayhem', '무작위 총력전: 아수라장') ON CONFLICT (slug) DO NOTHING;
