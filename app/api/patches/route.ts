import { NextResponse } from 'next/server';
import { sortPatchesByVersionDesc } from '@/lib/patch-version';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const { data, error, count } = await supabaseAdmin
    .from('patches')
    .select('*', { count: 'exact' });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const sorted = sortPatchesByVersionDesc(data ?? []);
  const paginated = sorted.slice((page - 1) * limit, page * limit);

  return NextResponse.json({
    data: paginated,
    page: page,
    limit: limit,
    total: count,
    hasNextPage: count ? page * limit < count : false,
  });
}
