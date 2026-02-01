import { NextResponse } from 'next/server';
// @ts-expect-error supabaseAdmin internal module
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  const { data, error, count } = await supabaseAdmin
    .from('patches')
    .select('*', { count: 'exact' })
    .order('release_date', { ascending: false })
    .order('version', { ascending: false }) // Secondary sort
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data,
    page: page,
    limit: limit,
    total: count,
    hasNextPage: count ? (page * limit < count) : false
  });
}
