import { cacheLife, cacheTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { GameMode } from '@/lib/data/patches';

const GAME_SLUG_MAP: Record<GameMode, string> = {
  'summoners-rift': 'league-of-legends',
  tft: 'teamfight-tactics',
  'aram-mayhem': 'aram-mayhem',
};

export interface SearchResultItem {
  id: string;
  name: string;
  category: string;
  changeType: string;
  summary: string;
}

export interface SearchResultGroup {
  patchVersion: string;
  patchTitle: string;
  patchReleaseDate: string | null;
  items: SearchResultItem[];
}

function matchesQuery(
  q: string,
  name: string,
  changes: { attribute: string | null; description: string | null }[]
): boolean {
  const lower = q.toLowerCase().trim();
  if (!lower) return false;
  if (name.toLowerCase().includes(lower)) return true;
  return changes.some(
    (c) =>
      (c.attribute?.toLowerCase().includes(lower)) ||
      (c.description?.toLowerCase().includes(lower))
  );
}

/**
 * Search across all patches for a game mode. Returns results grouped by patch version.
 */
export async function getSearchResults(
  q: string,
  mode: GameMode = 'summoners-rift'
): Promise<SearchResultGroup[]> {
  'use cache';
  cacheTag(`search-${mode}`, `search-${mode}-${q}`);
  cacheLife('hours');

  const slug = GAME_SLUG_MAP[mode];
  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!game) return [];

  const { data: itemsWithPatches, error } = await supabaseAdmin
    .from('patch_items')
    .select(
      `
      id,
      name,
      category,
      patch_id,
      patches!inner (
        version,
        title,
        release_date,
        game_id
      ),
      patch_changes (
        attribute,
        change_type,
        before_value,
        after_value,
        description
      )
    `
    )
    .eq('patches.game_id', game.id);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  const query = q.trim();
  if (!query) return [];

  const filtered = (itemsWithPatches || []).filter((item) => {
    const patch = item.patches as { version: string; title: string; release_date: string | null };
    const changes = (item.patch_changes || []) as {
      attribute: string | null;
      description: string | null;
      change_type: string;
      before_value: string | null;
      after_value: string | null;
    }[];
    return matchesQuery(query, item.name, changes);
  });

  const patchMap = new Map<string, SearchResultGroup>();

  for (const item of filtered) {
    const patch = item.patches as {
      version: string;
      title: string | null;
      release_date: string | null;
    };
    const changes = (item.patch_changes || []) as {
      attribute: string | null;
      change_type: string;
      before_value: string | null;
      after_value: string | null;
    }[];
    const summary = changes
      .filter((c) => c.attribute)
      .map(
        (c) =>
          `${c.attribute}: ${c.before_value ?? '-'} → ${c.after_value ?? '-'}`
      )
      .join('; ');
    const changeType = changes.map((c) => c.change_type).includes('NERF')
      ? 'NERF'
      : changes.map((c) => c.change_type).includes('BUFF')
        ? 'BUFF'
        : 'ADJUST';

    const entry: SearchResultItem = {
      id: item.id,
      name: item.name,
      category: item.category,
      changeType,
      summary: summary || '-',
    };

    const key = patch.version;
    if (!patchMap.has(key)) {
      patchMap.set(key, {
        patchVersion: patch.version,
        patchTitle: patch.title || `${patch.version} 패치 노트`,
        patchReleaseDate: patch.release_date,
        items: [],
      });
    }
    patchMap.get(key)!.items.push(entry);
  }

  const groups = Array.from(patchMap.values());
  groups.sort((a, b) => {
    const [aMaj, aMin] = a.patchVersion.split('.').map(Number);
    const [bMaj, bMin] = b.patchVersion.split('.').map(Number);
    if (aMaj !== bMaj) return bMaj - aMaj;
    return bMin - aMin;
  });

  return groups;
}
