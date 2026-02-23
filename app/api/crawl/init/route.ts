import { NextResponse } from 'next/server';
import { connection } from 'next/server';
import { revalidateTag } from 'next/cache';
import { crawlAndSavePatchesForInit } from '@/lib/crawler/save';
import { getPatchesCacheTag } from '@/lib/data/patches';

export const maxDuration = 120; // Init 크롤링은 Playwright 사용으로 더 오래 걸림

/**
 * Init용 크롤 API: "더 보기" 3회 클릭 후 전체 패치 수집.
 * DB truncate 후 로컬에서 수동 실행용. Vercel 서버리스에서는 Playwright 미지원.
 *
 * curl -X GET "http://localhost:3000/api/crawl/init" \
 *   -H "Authorization: Bearer $(grep CRON_SECRET .env.local | cut -d '=' -f2)"
 */
export async function GET(request: Request) {
  await connection();
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await crawlAndSavePatchesForInit();

    revalidateTag(getPatchesCacheTag('summoners-rift'), { expire: 0 });
    revalidateTag(getPatchesCacheTag('tft'), { expire: 0 });
    revalidateTag(getPatchesCacheTag('aram-mayhem'), { expire: 0 });
    revalidateTag('search-summoners-rift', { expire: 0 });
    revalidateTag('search-tft', { expire: 0 });
    revalidateTag('search-aram-mayhem', { expire: 0 });

    return NextResponse.json({ success: true, message: 'Init crawler finished' });
  } catch (error) {
    console.error('Init crawler failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
