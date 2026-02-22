"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { GameMode } from "@/lib/data/patches";

const MODES: { value: GameMode; label: string }[] = [
  { value: "summoners-rift", label: "소환사의 협곡" },
  { value: "tft", label: "전략적 팀 전투" },
];

export function ModeSelector() {
  const searchParams = useSearchParams();
  const current = (searchParams.get("mode") === "tft" ? "tft" : "summoners-rift") as GameMode;

  return (
    <div className="flex gap-2 p-1 rounded-lg bg-muted/50 w-fit">
      {MODES.map(({ value, label }) => (
        <Link
          key={value}
          href={value === "summoners-rift" ? "/" : `/?mode=${value}`}
          className={cn(
            "px-4 py-2 rounded-md text-sm font-medium transition-colors",
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
