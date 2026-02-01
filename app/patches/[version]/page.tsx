import { notFound } from 'next/navigation';
//
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PatchDetailView } from '@/components/patch-detail-view';

interface PageProps {
  params: Promise<{ version: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
    // Generate params for latest patches to be static
    const { data: patches } = await supabaseAdmin
        .from('patches')
        .select('version')
        .limit(10);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return patches?.map((p: any) => ({ version: p.version })) || [];
}

async function getPatchData(version: string) {
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

export default async function Page({ params }: PageProps) {
  const { version } = await params;
  const data = await getPatchData(version);

  if (!data) {
    notFound();
  }

  return <PatchDetailView patch={data.patch} items={data.items} />;
}
