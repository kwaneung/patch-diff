-- Add TFT (Teamfight Tactics) to games table
INSERT INTO games (slug, name) VALUES ('teamfight-tactics', '전략적 팀 전투') ON CONFLICT (slug) DO NOTHING;
