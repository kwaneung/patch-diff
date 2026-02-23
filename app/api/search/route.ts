import { NextResponse } from 'next/server';
import { getSearchResults } from '@/lib/data/search';
import type { GameMode } from '@/lib/data/patches';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const mode = (searchParams.get('mode') ?? 'summoners-rift') as GameMode;

  const validModes: GameMode[] = ['summoners-rift', 'tft', 'aram-mayhem'];
  if (!validModes.includes(mode)) {
    return NextResponse.json(
      { error: 'Invalid mode. Use summoners-rift, tft, or aram-mayhem.' },
      { status: 400 }
    );
  }

  const results = await getSearchResults(q, mode);
  return NextResponse.json(results);
}
