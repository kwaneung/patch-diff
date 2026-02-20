import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { crawlAndSavePatches } from '@/lib/crawler/save';
import { getPatchesCacheTag } from '@/lib/data/patches';

export const maxDuration = 60; // Allow longer timeout for crawling

export async function GET(request: Request) {
  try {
    // Secure the cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await crawlAndSavePatches();
    revalidateTag(getPatchesCacheTag(), { expire: 0 }); // Cron 호출 시 즉시 만료
    return NextResponse.json({ success: true, message: 'Crawler finished' });
  } catch (error) {
    console.error('Crawler failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
