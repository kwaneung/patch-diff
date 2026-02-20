import { NextResponse } from 'next/server';
//
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface PatchChange {
    attribute: string;
    change_type: string;
    before_value: string | null;
    after_value: string | null;
    description: string | null;
}

interface PatchItem {
    id: string;
    name: string;
    category: string;
    image_url: string | null;
    patch_changes: PatchChange[];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ version: string }> } // Params is a Promise in Next 15+
) {
  const version = (await params).version;
  const { searchParams } = new URL(request.url);
  const typeFilter = searchParams.get('type'); // 'BUFF', 'NERF', 'ADJUST'

  // Get patch
  const { data: patch, error: patchError } = await supabaseAdmin
    .from('patches')
    .select('id, version, title, release_date')
    .eq('version', version)
    .single();

  if (patchError || !patch) {
    return NextResponse.json({ error: 'Patch not found' }, { status: 404 });
  }

  // Get items with changes
  // We want: Item -> Changes
  // Supabase query to get nested?
  
  const query = supabaseAdmin
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

  const { data: items, error: itemsError } = await query;

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  // Client-side filtering might be easier for nested array, but let's see.
  // If typeFilter provided, we might want to filter items that HAVE that change type?
  // Or filter changes themselves?
  // Requirement: "Detail Page Filter Taps". User wants to see items relevant to that filter.
  
  let filteredItems = items as PatchItem[];
  if (typeFilter && items) {
      filteredItems = (items as PatchItem[]).filter((item) => {
          const changes = item.patch_changes || [];
          // Does this item have ANY change of this type?
          return changes.some((c) => c.change_type === typeFilter);
      }).map((item) => ({
          ...item,
          // Optional: Only show relevant changes? Usually yes.
          patch_changes: item.patch_changes.filter((c) => c.change_type === typeFilter)
      })).filter((item) => item.patch_changes.length > 0);
  }

  return NextResponse.json({
    patch: patch,
    items: filteredItems
  });
}
