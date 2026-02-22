import { Suspense } from 'react';
import { PatchCard } from '@/components/patch-card';
import { ModeSelector } from '@/components/mode-selector';
import { getPatches } from '@/lib/data/patches';
import type { GameMode } from '@/lib/data/patches';

interface HomeProps {
  searchParams: Promise<{ mode?: string }>;
}

async function HomeContent({ searchParams }: HomeProps) {
  const params = await searchParams;
  const gameMode: GameMode = params.mode === 'tft' ? 'tft' : 'summoners-rift';
  const patches = await getPatches(gameMode);

  return (
    <>
      <div className="flex flex-col items-center mb-10 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          PatchDiff.gg
        </h1>
        <p className="text-xl text-muted-foreground max-w-[600px]">
          League of Legends 패치 노트를 <br className="hidden sm:inline"/>
          <span className="font-semibold text-foreground">팩트 중심</span>으로 빠르고 명확하게 확인하세요.
        </p>
        <Suspense fallback={<div className="h-10 mt-4" />}>
          <ModeSelector />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patches.map((patch) => (
          <PatchCard key={patch.id} patch={patch} gameMode={gameMode} />
        ))}
      </div>

      {patches.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p>아직 등록된 패치 데이터가 없습니다.</p>
        </div>
      )}
    </>
  );
}

export default function Home(props: HomeProps) {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="animate-pulse py-20 text-center text-muted-foreground">로딩 중...</div>}>
        <HomeContent {...props} />
      </Suspense>
    </div>
  );
}