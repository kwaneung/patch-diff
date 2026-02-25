import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon } from 'lucide-react';
import { formatReleaseDateKst } from '@/lib/format';
import type { GameMode } from '@/lib/data/patches';

interface PatchCardProps {
  patch: {
    id: string;
    version: string;
    title: string | null;
    release_date: string | null;
  };
  gameMode?: GameMode;
}

export function PatchCard({ patch, gameMode = 'summoners-rift' }: PatchCardProps) {
  const href =
    gameMode === 'tft'
      ? `/patches/${patch.version}?mode=tft`
      : gameMode === 'aram-mayhem'
        ? `/patches/${patch.version}?mode=aram-mayhem`
        : `/patches/${patch.version}`;
  return (
    <Link href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full border-zinc-200 dark:border-zinc-800">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[0.5rem]">
          <CardTitle className="text-lg @[40rem]:text-xl font-bold">
            Patch {patch.version}
          </CardTitle>
          <Badge variant="outline">{patch.title || 'Update'}</Badge>
        </CardHeader>
        <CardContent>
          <div className="flex items-center text-sm text-muted-foreground mt-[0.5rem]">
            <CalendarIcon className="mr-1 h-4 w-4" />
            {formatReleaseDateKst(patch.release_date) || 'Unknown Date'}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
