import { NextResponse } from 'next/server';
import { crawlAndSavePatches } from '@/lib/crawler/save';

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 60; // Allow longer timeout for crawling

export async function GET(request: Request) {
  try {
    // Optional: Add simple secret check to prevent abuse
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    await crawlAndSavePatches();
    return NextResponse.json({ success: true, message: 'Crawler finished' });
  } catch (error) {
    console.error('Crawler failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
