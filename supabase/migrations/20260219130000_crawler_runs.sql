-- Crawler metadata: last crawl time per game mode
CREATE TABLE IF NOT EXISTS crawler_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    last_crawled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id)
);

CREATE INDEX IF NOT EXISTS idx_crawler_runs_game_id ON crawler_runs(game_id);
