"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/lib/data/patches";

const MODES: { value: GameMode; label: string }[] = [
  { value: "summoners-rift", label: "소환사의 협곡" },
  { value: "tft", label: "전략적 팀 전투" },
  { value: "aram-mayhem", label: "증바람" },
];

export function ModeSelector() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const current = (modeParam === "tft" ? "tft" : modeParam === "aram-mayhem" ? "aram-mayhem" : "summoners-rift") as GameMode;

  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 p-1 rounded-lg bg-muted/50 w-full sm:w-fit max-w-md sm:max-w-none mx-auto">
      {MODES.map(({ value, label }) => (
        <Link
          key={value}
          href={value === "summoners-rift" ? "/" : `/?mode=${value}`}
          className={cn(
            "px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors",
            current === value
              ? "bg-background shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
