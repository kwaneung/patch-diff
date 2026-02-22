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
  const [lolPatches, tftPatches] = await Promise.all([
    getPatches('summoners-rift'),
    getPatches('tft'),
  ]);
  const lol = lolPatches.slice(0, 5).map((p) => ({ version: p.version }));
  const tft = tftPatches.slice(0, 5).map((p) => ({ version: p.version }));
  return [...lol, ...tft];
}

async function PatchDetailContent({ params, searchParams }: PageProps) {
  const { version } = await params;
  const { mode } = await searchParams;
  const gameMode: GameMode = mode === 'tft' ? 'tft' : 'summoners-rift';
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
    <Suspense fallback={<div className="container mx-auto py-6 animate-pulse">Loading...</div>}>
      <PatchDetailContent {...props} />
    </Suspense>
  );
}
