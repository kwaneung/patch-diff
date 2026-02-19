import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { crawlAndSavePatches } from '@/lib/crawler/save';

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 60; // Allow longer timeout for crawling

export async function GET(request: Request) {
  try {
    // Secure the cron job
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await crawlAndSavePatches();
    revalidatePath('/'); // 메인 페이지 캐시 무효화 → 새 패치 즉시 반영
    return NextResponse.json({ success: true, message: 'Crawler finished' });
  } catch (error) {
    console.error('Crawler failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
