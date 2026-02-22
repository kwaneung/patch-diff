import { cacheLife, cacheTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export type GameMode = 'summoners-rift' | 'tft';

const GAME_SLUG_MAP: Record<GameMode, string> = {
  'summoners-rift': 'league-of-legends',
  tft: 'teamfight-tactics',
};

function cacheTagForMode(mode: GameMode): string {
  return `patches-${mode}`;
}

export async function getPatches(gameMode: GameMode = 'summoners-rift') {
  'use cache';
  const tag = cacheTagForMode(gameMode);
  cacheTag(tag);
  cacheLife('hours');

  const slug = GAME_SLUG_MAP[gameMode];
  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!game) return [];

  const { data: patches, error } = await supabaseAdmin
    .from('patches')
    .select('id, version, title, release_date')
    .eq('game_id', game.id)
    .order('release_date', { ascending: false })
    .order('version', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching patches:', error);
    return [];
  }
  return patches;
}

export async function getPatchData(version: string, gameMode: GameMode = 'summoners-rift') {
  'use cache';
  const tag = cacheTagForMode(gameMode);
  cacheTag(tag, `patch-${gameMode}-${version}`);
  cacheLife('hours');

  const slug = GAME_SLUG_MAP[gameMode];
  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!game) return null;

  const { data: patch } = await supabaseAdmin
    .from('patches')
    .select('id, version, title, release_date')
    .eq('game_id', game.id)
    .eq('version', version)
    .single();

  if (!patch) return null;

  const { data: items } = await supabaseAdmin
    .from('patch_items')
    .select(`
      id,
      name,
      category,
      image_url,
      patch_changes (
        attribute,
        change_type,
        before_value,
        after_value,
        description
      )
    `)
    .eq('patch_id', patch.id);

  return { patch, items: items || [] };
}

export function getPatchesCacheTag(gameMode?: GameMode): string {
  return gameMode ? cacheTagForMode(gameMode) : 'patches-summoners-rift';
}
