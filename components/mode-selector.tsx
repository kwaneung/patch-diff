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
    <div className="flex flex-wrap justify-center gap-[0.375rem] @[40rem]:gap-[0.5rem] p-[0.25rem] rounded-lg bg-muted/50 w-full @[40rem]:w-fit max-w-[28rem] @[40rem]:max-w-none mx-auto">
      {MODES.map(({ value, label }) => (
        <Link
          key={value}
          href={value === "summoners-rift" ? "/" : `/?mode=${value}`}
          className={cn(
            "px-[0.75rem] py-[0.375rem] @[40rem]:px-[1rem] @[40rem]:py-[0.5rem] rounded-md text-xs @[40rem]:text-sm font-medium transition-colors min-h-[2.75rem] min-w-[2.75rem] flex items-center justify-center",
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
