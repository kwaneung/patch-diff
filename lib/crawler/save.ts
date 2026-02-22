import { fetchPatchList, fetchTftPatchList } from './index';
import { parsePatchDetail } from '../parser/index';
import { parseTftPatchDetail } from '../parser/tft';
import { supabaseAdmin } from '../supabaseAdmin';

type GameSlug = 'league-of-legends' | 'teamfight-tactics';

async function crawlAndSaveForGame(
  gameSlug: GameSlug,
  fetchList: () => Promise<{ version: string; url: string; date: string; title: string }[]>,
  parseDetail: (html: string) => import('./types').PatchChangeParsed[]
) {
  const patches = await fetchList();
  console.log(`[${gameSlug}] Found ${patches.length} patches.`);

  const { data: game } = await supabaseAdmin
    .from('games')
    .select('id')
    .eq('slug', gameSlug)
    .single();

  if (!game) {
    console.error(`Game "${gameSlug}" not found in DB.`);
    return;
  }

  const { data: existingPatches } = await supabaseAdmin
    .from('patches')
    .select('version')
    .eq('game_id', game.id);

  const existingVersions = new Set(existingPatches?.map((p) => p.version));

  for (const patch of patches) {
    if (existingVersions.has(patch.version)) {
      console.log(`Patch ${patch.version} already exists. Skipping.`);
      continue;
    }

    console.log(`Processing Patch ${patch.version}...`);
    
    // Fetch Detail HTML
    const response = await fetch(patch.url);
    if (!response.ok) {
        console.error(`Failed to fetch ${patch.url}`);
        continue;
    }
    const html = await response.text();
    
    // Parse (uses game-specific parser: parsePatchDetail for LoL, parseTftPatchDetail for TFT)
    const parsedItems = parseDetail(html);
    console.log(`  Parsed ${parsedItems.length} items.`);

    // Insert Patch
    const { data: patchData, error: patchError } = await supabaseAdmin
        .from('patches')
        .insert({
            game_id: game.id,
            version: patch.version,
            title: patch.title,
            release_date: patch.date
        })
        .select()
        .single();

    if (patchError || !patchData) {
        console.error(`Error inserting patch ${patch.version}:`, patchError);
        continue;
    }
    
    // Insert Items and Changes
    // We should probably optimize this with bulk inserts if possible, 
    // but relational integrity requires IDs. 
    // So we iterate.
    
    for (const item of parsedItems) {
        const { data: itemData, error: itemError } = await supabaseAdmin
            .from('patch_items')
            .insert({
                patch_id: patchData.id,
                name: item.name,
                category: item.category
            })
            .select()
            .single();
            
        if (itemError || !itemData) {
             console.error(`  Error inserting item ${item.name}:`, itemError);
             continue;
        }
        
        // Insert Changes
        if (item.attributes.length > 0) {
            const changesPayload = item.attributes.map(attr => ({
                patch_item_id: itemData.id,
                attribute: attr.name,
                change_type: attr.changeType,
                before_value: attr.before,
                after_value: attr.after,
                description: `${attr.name}: ${attr.before} -> ${attr.after}`
            }));
             
            const { error: changesError } = await supabaseAdmin
                .from('patch_changes')
                .insert(changesPayload);
                
            if (changesError) {
                console.error(`  Error inserting changes for ${item.name}:`, changesError);
            }
        }
    }
    console.log(`  [${gameSlug}] Saved Patch ${patch.version} successfully.`);
  }

  // Update crawler_runs metadata
  const now = new Date().toISOString();
  await supabaseAdmin
    .from('crawler_runs')
    .upsert(
      { game_id: game.id, last_crawled_at: now },
      { onConflict: 'game_id', ignoreDuplicates: false }
    );
}

export async function crawlAndSavePatches() {
  console.log('Starting crawler...');

  await crawlAndSaveForGame('league-of-legends', fetchPatchList, parsePatchDetail);
  await crawlAndSaveForGame('teamfight-tactics', fetchTftPatchList, parseTftPatchDetail);
}
