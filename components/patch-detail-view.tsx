"use client";

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PatchChangeRow } from './patch-change-row';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface PatchChange {
  attribute: string | null;
  change_type: 'BUFF' | 'NERF' | 'ADJUST';
  before_value: string | null;
  after_value: string | null;
  description: string | null;
}

export interface PatchItem {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  patch_changes: PatchChange[];
}

interface PatchDetailViewProps {
  patch: {
    version: string;
    title: string | null;
    release_date: string | null;
  };
  items: PatchItem[];
}

type FilterType = 'ALL' | 'BUFF' | 'NERF' | 'ADJUST';

export function PatchDetailView({ patch, items }: PatchDetailViewProps) {
  const [filter, setFilter] = useState<FilterType>('ALL');

  // Filter items based on selected type
  const filteredItems = items.filter(item => {
    if (filter === 'ALL') return true;
    return item.patch_changes.some((c) => c.change_type === filter);
  });

  // Calculate counts for badges
  const buffCount = items.filter(i => i.patch_changes.some((c) => c.change_type === 'BUFF')).length;
  const nerfCount = items.filter(i => i.patch_changes.some((c) => c.change_type === 'NERF')).length;
  const adjustCount = items.filter(i => i.patch_changes.some((c) => c.change_type === 'ADJUST')).length;

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href="/" passHref>
             <Button variant="ghost" className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
                <ChevronLeft className="h-4 w-4 mr-2" /> Back to List
             </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Patch {patch.version}</h1>
        <p className="text-muted-foreground mt-1">
          {patch.title} • {patch.release_date ? new Date(patch.release_date).toLocaleDateString() : ''}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
        <FilterBadge 
            active={filter === 'ALL'} 
            onClick={() => setFilter('ALL')} 
            label="All" 
            count={items.length} 
        />
        <FilterBadge 
            active={filter === 'BUFF'} 
            onClick={() => setFilter('BUFF')} 
            label="Buff" 
            count={buffCount} 
            color="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        />
        <FilterBadge 
            active={filter === 'NERF'} 
            onClick={() => setFilter('NERF')} 
            label="Nerf" 
            count={nerfCount} 
            color="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        />
        <FilterBadge 
            active={filter === 'ADJUST'} 
            onClick={() => setFilter('ADJUST')} 
            label="Adjust" 
            count={adjustCount} 
            color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
        />
      </div>

      {/* Content */}
      <div className="grid gap-6">
        {filteredItems.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                No items found for this filter.
            </div>
        ) : (
            filteredItems.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                {item.image_url && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={item.image_url} alt={item.name} className="w-8 h-8 rounded-full object-cover border" />
                                )}
                                {item.name}
                            </CardTitle>
                            <Badge variant="secondary" className="uppercase text-xs">{item.category}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        {item.patch_changes
                            .filter((c) => filter === 'ALL' || c.change_type === filter)
                            .map((change, idx) => (
                                <PatchChangeRow key={idx} change={change} />
                        ))}
                    </CardContent>
                </Card>
            ))
        )}
      </div>
    </div>
  );
}

interface FilterBadgeProps {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
    color?: string;
}

function FilterBadge({ active, onClick, label, count, color }: FilterBadgeProps) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
                active 
                    ? "ring-2 ring-primary border-primary" 
                    : "border-transparent hover:bg-muted",
                color && !active ? color : "bg-secondary text-secondary-foreground"
            )}
        >
            {label} <span className="ml-1 opacity-70 text-xs">({count})</span>
        </button>
    )
}
