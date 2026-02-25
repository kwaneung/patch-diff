"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatchChangeRow } from "./patch-change-row";
import { cn } from "@/lib/utils";
import { formatReleaseDateKst } from "@/lib/format";
import Link from "next/link";
import { ChevronLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface PatchChange {
  attribute: string | null;
  change_type: "BUFF" | "NERF" | "ADJUST";
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
  gameMode?: "summoners-rift" | "tft" | "aram-mayhem";
}

type FilterType = "ALL" | "BUFF" | "NERF" | "ADJUST";
type CategoryFilterType = "ALL" | string;

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    champion: "챔피언",
    item: "아이템",
    system: "시스템",
    trait: "특성",
    unit: "유닛",
    augment: "증강",
    augment_set: "증강 세트",
    progress_track: "진척도 트랙",
    bugfix: "버그 수정",
  };
  return map[cat] ?? cat;
}

export function PatchDetailView({ patch, items, gameMode = "summoners-rift" }: PatchDetailViewProps) {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Sync from URL on mount
  useEffect(() => {
    const type = searchParams.get("type");
    const category = searchParams.get("category");
    if (type && ["BUFF", "NERF", "ADJUST"].includes(type)) {
      setFilter(type as FilterType);
    }
    if (category) {
      setCategoryFilter(category);
    }
  }, [searchParams]);

  const setFilterAndUrl = (f: FilterType) => {
    setFilter(f);
    const params = new URLSearchParams(searchParams.toString());
    if (f !== "ALL") params.set("type", f);
    else params.delete("type");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  };
  const setCategoryFilterAndUrl = (c: CategoryFilterType) => {
    setCategoryFilter(c);
    const params = new URLSearchParams(searchParams.toString());
    if (c !== "ALL") params.set("category", c);
    else params.delete("category");
    window.history.replaceState(null, "", `${window.location.pathname}${params.toString() ? `?${params}` : ""}`);
  };

  // Filter items based on selected type, category, and search
  const filteredItems = items.filter((item) => {
    const matchesType =
      filter === "ALL" || item.patch_changes.some((c) => c.change_type === filter);
    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.patch_changes.some(
        (c) =>
          (c.attribute?.toLowerCase().includes(q) ?? false) ||
          (c.description?.toLowerCase().includes(q) ?? false)
      );
    return matchesType && matchesCategory && matchesSearch;
  });

  // Calculate counts for badges
  const buffCount = items.filter((i) =>
    i.patch_changes.some((c) => c.change_type === "BUFF"),
  ).length;
  const nerfCount = items.filter((i) =>
    i.patch_changes.some((c) => c.change_type === "NERF"),
  ).length;
  const adjustCount = items.filter((i) =>
    i.patch_changes.some((c) => c.change_type === "ADJUST"),
  ).length;

  return (
    <div className="@container w-full max-w-5xl mx-auto py-[1.5rem] px-[1rem] @[40rem]:px-[1.5rem] @[64rem]:px-[2rem]">
      {/* Header */}
      <div className="mb-[1.5rem]">
        <Link href={gameMode && gameMode !== "summoners-rift" ? `/?mode=${gameMode}` : "/"} passHref>
          <Button
            variant="ghost"
            className="mb-[0.5rem] pl-0 hover:bg-transparent hover:text-primary min-h-[2.75rem]"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> 패치 목록으로
          </Button>
        </Link>
        <h1 className="text-[1.5rem] @[40rem]:text-[1.875rem] font-bold tracking-tight">
          패치 {patch.version}
        </h1>
        <p className="text-muted-foreground mt-[0.25rem]">
          {patch.title} •{" "}
          {formatReleaseDateKst(patch.release_date)}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-col @[40rem]:flex-row @[40rem]:flex-wrap @[64rem]:flex-nowrap @[64rem]:justify-between gap-[0.5rem] mb-[2rem] sticky top-0 z-10 bg-background/95 backdrop-blur py-[0.5rem] border-b">
        <div className="flex flex-wrap gap-[0.5rem] items-center">
          <FilterBadge
            active={filter === "ALL"}
            onClick={() => setFilterAndUrl("ALL")}
            label="전체"
            count={items.length}
            color="bg-muted text-foreground"
            activeRingColor="ring-2 ring-slate-500 border-slate-500 dark:ring-slate-400 dark:border-slate-400"
          />
          <FilterBadge
            active={filter === "BUFF"}
            onClick={() => setFilterAndUrl("BUFF")}
            label="상향"
            count={buffCount}
            color="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            activeRingColor="ring-2 ring-red-500 border-red-500 dark:ring-red-400 dark:border-red-400"
          />
          <FilterBadge
            active={filter === "NERF"}
            onClick={() => setFilterAndUrl("NERF")}
            label="하향"
            count={nerfCount}
            color="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            activeRingColor="ring-2 ring-blue-500 border-blue-500 dark:ring-blue-400 dark:border-blue-400"
          />
          <FilterBadge
            active={filter === "ADJUST"}
            onClick={() => setFilterAndUrl("ADJUST")}
            label="조정"
            count={adjustCount}
            color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            activeRingColor="ring-2 ring-yellow-500 border-yellow-500 dark:ring-yellow-400 dark:border-yellow-400"
          />
        </div>
        <div className="flex flex-wrap gap-[0.5rem] items-center @[40rem]:border-l @[40rem]:pl-[1rem] @[40rem]:ml-[0.5rem]">
          <span className="text-sm text-muted-foreground mr-[0.25rem]">카테고리:</span>
          {(["ALL", ...new Set(items.map((i) => i.category).filter(Boolean))] as string[]).map((cat) => (
            <FilterBadge
              key={cat}
              active={categoryFilter === cat}
              onClick={() => setCategoryFilterAndUrl(cat as CategoryFilterType)}
              label={cat === "ALL" ? "전체" : getCategoryLabel(cat)}
              count={
                cat === "ALL"
                  ? items.length
                  : items.filter((i) => i.category === cat).length
              }
              color="bg-muted text-foreground"
              activeRingColor="ring-2 ring-slate-500 border-slate-500 dark:ring-slate-400 dark:border-slate-400"
            />
          ))}
        </div>
        <div className="flex items-center gap-[0.5rem] shrink-0 w-full @[64rem]:w-auto">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="search"
            placeholder="챔피언·아이템·변경 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-0 @[64rem]:w-[14rem]"
          />
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-[1.5rem]">
        {filteredItems.length === 0 ? (
          <div className="text-center py-[2.5rem] text-muted-foreground">
            선택한 필터에 맞는 항목이 없습니다.
          </div>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 py-[1rem]">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-[0.5rem]">
                    {item.image_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-8 h-8 rounded-full object-cover border"
                      />
                    )}
                    {item.name}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {getCategoryLabel(item.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-[1rem]">
                {item.patch_changes
                  .filter((c) => filter === "ALL" || c.change_type === filter)
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
  /** 선택 시 테두리/링 색상 (안쪽 색과 어울리게) */
  activeRingColor?: string;
}

function FilterBadge({
  active,
  onClick,
  label,
  count,
  color,
  activeRingColor,
}: FilterBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-[1rem] py-[0.375rem] rounded-full text-sm font-medium transition-all border min-h-[2.75rem]",
        active
          ? activeRingColor ?? "ring-2 ring-primary border-primary"
          : "border-transparent hover:bg-muted",
        active && activeRingColor && color ? color : color && !active ? color : "bg-secondary text-secondary-foreground",
      )}
    >
      {label} <span className="ml-[0.25rem] opacity-70 text-xs">({count})</span>
    </button>
  );
}
