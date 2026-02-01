import { fetchPatchList } from './index'; // crawler/index.ts
import { parsePatchDetail } from '../parser/index';
//
import { supabaseAdmin } from '../supabaseAdmin';
// import { Database } from '../../types/database.types'; // Unused

export async function crawlAndSavePatches() {
  console.log('Starting crawler...');
  
  // 1. Fetch List
  const patches = await fetchPatchList();
  console.log(`Found ${patches.length} patches.`);

  // 2. Get existing patches to avoid duplicates
  const { data: existingPatches, error } = await supabaseAdmin
    .from('patches')
    .select('version');

  if (error) {
    console.error('Error fetching existing patches:', error);
    return;
  }

  const existingVersions = new Set(existingPatches?.map(p => p.version));

  // 3. Process new patches
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
    
    // Parse
    const parsedItems = parsePatchDetail(html);
    console.log(`  Parsed ${parsedItems.length} items.`);

    // Save to DB
    // Get Game ID (assume LoL exists)
    const { data: game } = await supabaseAdmin
        .from('games')
        .select('id')
        .eq('slug', 'league-of-legends')
        .single();
    
    if (!game) {
        console.error('Game "League of Legends" not found in DB.');
        return;
    }

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
    console.log(`  Saved Patch ${patch.version} successfully.`);
  }
}
