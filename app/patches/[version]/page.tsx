import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getPatches, getPatchData } from '@/lib/data/patches';
import { PatchDetailView } from '@/components/patch-detail-view';
import type { GameMode } from '@/lib/data/patches';

interface PageProps {
  params: Promise<{ version: string }>;
  searchParams: Promise<{ mode?: string }>;
}

export async function generateStaticParams() {
  const [lolPatches, tftPatches, aramPatches] = await Promise.all([
    getPatches('summoners-rift'),
    getPatches('tft'),
    getPatches('aram-mayhem'),
  ]);
  const lol = lolPatches.slice(0, 5).map((p) => ({ version: p.version }));
  const tft = tftPatches.slice(0, 5).map((p) => ({ version: p.version }));
  const aram = aramPatches.slice(0, 5).map((p) => ({ version: p.version }));
  return [...lol, ...tft, ...aram];
}

async function PatchDetailContent({ params, searchParams }: PageProps) {
  const { version } = await params;
  const { mode } = await searchParams;
  const gameMode: GameMode =
    mode === 'tft' ? 'tft' : mode === 'aram-mayhem' ? 'aram-mayhem' : 'summoners-rift';
  const data = await getPatchData(version, gameMode);

  if (!data) {
    notFound();
  }

  return (
    <PatchDetailView patch={data.patch} items={data.items} gameMode={gameMode} />
  );
}

export default function Page(props: PageProps) {
  return (
    <Suspense fallback={<div className="@container w-full max-w-5xl mx-auto py-[1.5rem] px-[1rem] @[40rem]:px-[1.5rem] @[64rem]:px-[2rem] animate-pulse text-center text-muted-foreground">로딩 중...</div>}>
      <PatchDetailContent {...props} />
    </Suspense>
  );
}
