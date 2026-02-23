'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { GameMode } from '@/lib/data/patches';

const MODES: { value: GameMode; label: string }[] = [
  { value: 'summoners-rift', label: '소환사의 협곡' },
  { value: 'tft', label: '전략적 팀 전투' },
  { value: 'aram-mayhem', label: '증바람' },
];

interface SearchModeSelectorProps {
  currentMode: GameMode;
  searchQuery: string;
}

export function SearchModeSelector({
  currentMode,
  searchQuery,
}: SearchModeSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 p-1 rounded-lg bg-muted/50 w-full sm:w-fit max-w-md sm:max-w-none">
      {MODES.map(({ value, label }) => {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (value !== 'summoners-rift') params.set('mode', value);
        const href = `/search${params.toString() ? `?${params}` : ''}`;
        return (
          <Link
            key={value}
            href={href}
            className={cn(
              'px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors',
              currentMode === value
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
