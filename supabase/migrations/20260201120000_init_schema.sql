-- Create enum for change type
CREATE TYPE change_type AS ENUM ('BUFF', 'NERF', 'ADJUST');

-- Create games table
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patches table
CREATE TABLE patches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    release_date DATE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(game_id, version)
);

-- Create patch_items table
CREATE TABLE patch_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patch_id UUID NOT NULL REFERENCES patches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'champion', 'item', 'system'
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patch_changes table
CREATE TABLE patch_changes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patch_item_id UUID NOT NULL REFERENCES patch_items(id) ON DELETE CASCADE,
    attribute TEXT, -- e.g., 'Q - Orb of Deception' or 'Cost'
    change_type change_type NOT NULL,
    before_value TEXT,
    after_value TEXT,
    description TEXT,
    raw_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_patches_game_id ON patches(game_id);
CREATE INDEX idx_patch_items_patch_id ON patch_items(patch_id);
CREATE INDEX idx_patch_changes_patch_item_id ON patch_changes(patch_item_id);

-- Insert initial data for League of Legends
INSERT INTO games (slug, name) VALUES ('league-of-legends', 'League of Legends') ON CONFLICT DO NOTHING;
