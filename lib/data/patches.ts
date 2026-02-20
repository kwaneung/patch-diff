import { cacheLife, cacheTag } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const CACHE_TAG = 'patches';

export async function getPatches() {
  'use cache';
  cacheTag(CACHE_TAG);
  cacheLife('hours'); // 1시간 revalidate (stale-while-revalidate)

  const { data: patches, error } = await supabaseAdmin
    .from('patches')
    .select('id, version, title, release_date')
    .order('release_date', { ascending: false })
    .order('version', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching patches:', error);
    return [];
  }
  return patches;
}

export async function getPatchData(version: string) {
  'use cache';
  cacheTag(CACHE_TAG, `patch-${version}`);
  cacheLife('hours');

  const { data: patch } = await supabaseAdmin
    .from('patches')
    .select('id, version, title, release_date')
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

export function getPatchesCacheTag() {
  return CACHE_TAG;
}
