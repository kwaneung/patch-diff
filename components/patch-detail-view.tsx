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
  gameMode?: "summoners-rift" | "tft";
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
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={gameMode === "tft" ? "/?mode=tft" : "/"} passHref>
          <Button
            variant="ghost"
            className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4 mr-2" /> Back to List
          </Button>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Patch {patch.version}
        </h1>
        <p className="text-muted-foreground mt-1">
          {patch.title} •{" "}
          {formatReleaseDateKst(patch.release_date)}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap justify-between gap-2 mb-8 sticky top-0 z-10 bg-background/95 backdrop-blur py-2 border-b">
        <div className="flex flex-wrap gap-2 items-center">
          <FilterBadge
            active={filter === "ALL"}
            onClick={() => setFilterAndUrl("ALL")}
            label="All"
            count={items.length}
          />
          <FilterBadge
            active={filter === "BUFF"}
            onClick={() => setFilterAndUrl("BUFF")}
            label="Buff"
            count={buffCount}
            color="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          />
          <FilterBadge
            active={filter === "NERF"}
            onClick={() => setFilterAndUrl("NERF")}
            label="Nerf"
            count={nerfCount}
            color="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          />
          <FilterBadge
            active={filter === "ADJUST"}
            onClick={() => setFilterAndUrl("ADJUST")}
            label="Adjust"
            count={adjustCount}
            color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center border-l pl-4 ml-2">
          <span className="text-sm text-muted-foreground mr-1">카테고리:</span>
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
            />
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="챔피언·아이템·변경 내용 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-56"
          />
        </div>
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
              <CardContent className="pt-4">
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
}

function FilterBadge({
  active,
  onClick,
  label,
  count,
  color,
}: FilterBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
        active
          ? "ring-2 ring-primary border-primary"
          : "border-transparent hover:bg-muted",
        color && !active ? color : "bg-secondary text-secondary-foreground",
      )}
    >
      {label} <span className="ml-1 opacity-70 text-xs">({count})</span>
    </button>
  );
}
