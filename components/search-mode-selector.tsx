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
    <div className="flex flex-wrap gap-[0.375rem] @[40rem]:gap-[0.5rem] p-[0.25rem] rounded-lg bg-muted/50 w-full @[40rem]:w-fit max-w-[28rem] @[40rem]:max-w-none">
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
              'px-[0.75rem] py-[0.375rem] @[40rem]:px-[1rem] @[40rem]:py-[0.5rem] rounded-md text-xs @[40rem]:text-sm font-medium transition-colors min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center',
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
