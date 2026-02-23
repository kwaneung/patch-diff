import { Suspense } from 'react';
import Link from 'next/link';
import { getSearchResults } from '@/lib/data/search';
import type { GameMode } from '@/lib/data/patches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SearchModeSelector } from '@/components/search-mode-selector';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatReleaseDateKst } from '@/lib/format';

const MODE_LABELS: Record<GameMode, string> = {
  'summoners-rift': '소환사의 협곡',
  tft: '전략적 팀 전투',
  'aram-mayhem': '증바람',
};

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    champion: '챔피언',
    item: '아이템',
    system: '시스템',
    trait: '특성',
    unit: '유닛',
    augment: '증강',
    augment_set: '증강 세트',
    progress_track: '진척도 트랙',
    bugfix: '버그 수정',
  };
  return map[cat] ?? cat;
}

function ChangeTypeBadge({ type }: { type: string }) {
  const variant =
    type === 'BUFF'
      ? 'destructive'
      : type === 'NERF'
        ? 'default'
        : 'secondary';
  const label = type === 'BUFF' ? '상향' : type === 'NERF' ? '하향' : '조정';
  return (
    <Badge variant={variant} className="text-xs">
      {label}
    </Badge>
  );
}

interface SearchContentProps {
  q: string;
  mode: GameMode;
}

async function SearchContent({ q, mode }: SearchContentProps) {
  const results = await getSearchResults(q, mode);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground">
          &quot;{q}&quot; 검색 결과 ({MODE_LABELS[mode]})
        </p>
        <p className="text-sm text-muted-foreground">
          {results.reduce((acc, g) => acc + g.items.length, 0)}개 항목 ·{' '}
          {results.length}개 패치
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          검색 결과가 없습니다. 다른 검색어로 시도해 보세요.
        </div>
      ) : (
        <div className="space-y-6">
          {results.map((group) => (
            <Card key={group.patchVersion} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-4">
                <Link
                  href={
                    mode === 'tft'
                      ? `/patches/${group.patchVersion}?mode=tft`
                      : mode === 'aram-mayhem'
                        ? `/patches/${group.patchVersion}?mode=aram-mayhem`
                        : `/patches/${group.patchVersion}`
                  }
                >
                  <CardTitle className="text-lg hover:underline">
                    {group.patchVersion} 패치
                  </CardTitle>
                </Link>
                <p className="text-sm text-muted-foreground">
                  {formatReleaseDateKst(group.patchReleaseDate)}
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {group.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-start gap-2 rounded-lg border p-3"
                    >
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {getCategoryLabel(item.category)}
                      </Badge>
                      <ChangeTypeBadge type={item.changeType} />
                      <span className="w-full text-sm text-muted-foreground">
                        {item.summary}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

interface SearchPageInnerProps {
  searchParams: Promise<{ q?: string; mode?: string }>;
}

async function SearchPageInner({ searchParams }: SearchPageInnerProps) {
  const params = await searchParams;
  const q = params.q?.trim() ?? '';
  const mode: GameMode =
    params.mode === 'tft' ? 'tft' : params.mode === 'aram-mayhem' ? 'aram-mayhem' : 'summoners-rift';

  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href={mode === 'tft' ? '/?mode=tft' : mode === 'aram-mayhem' ? '/?mode=aram-mayhem' : '/'}
          className="inline-block mb-4"
        >
          <Button
            variant="ghost"
            className={cn(
              'pl-0 hover:bg-transparent hover:text-primary',
              'text-foreground'
            )}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            패치 목록으로
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
          전체 패치 검색
        </h1>
        <SearchModeSelector currentMode={mode} searchQuery={q} />
      </div>

      {q ? (
        <SearchContent q={q} mode={mode} />
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          검색어를 입력해 주세요. 메인 화면의 검색창에서 검색할 수 있습니다.
        </div>
      )}
    </div>
  );
}

interface SearchPageProps {
  searchParams: Promise<{ q?: string; mode?: string }>;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <div className="py-20 text-center text-muted-foreground animate-pulse">
            로딩 중...
          </div>
        </div>
      }
    >
      <SearchPageInner searchParams={searchParams} />
    </Suspense>
  );
}
