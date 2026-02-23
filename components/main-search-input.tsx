'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { GameMode } from '@/lib/data/patches';

export function MainSearchInput() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const mode: GameMode =
    modeParam === 'tft' ? 'tft' : modeParam === 'aram-mayhem' ? 'aram-mayhem' : 'summoners-rift';

  const [q, setQ] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    const params = new URLSearchParams();
    params.set('q', trimmed);
    if (mode === 'tft') params.set('mode', 'tft');
    if (mode === 'aram-mayhem') params.set('mode', 'aram-mayhem');
    router.push(`/search?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-xl mx-auto flex gap-2 px-2 sm:px-0"
    >
      <Input
        type="search"
        placeholder="챔피언·아이템 검색 (예: 아트록스)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="flex-1 min-w-0"
      />
      <Button type="submit" size="default">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}
