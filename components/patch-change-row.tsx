import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
//

interface PatchChangeRowProps {
  change: {
    attribute: string | null;
    change_type: "BUFF" | "NERF" | "ADJUST";
    before_value: string | null;
    after_value: string | null;
    description: string | null;
  };
}

export function PatchChangeRow({ change }: PatchChangeRowProps) {
  const isBuff = change.change_type === "BUFF";
  const isNerf = change.change_type === "NERF";

  return (
    <div className="flex flex-col @[40rem]:flex-row @[40rem]:items-center py-[0.5rem] border-b last:border-0 border-border">
      {/* Attribute Name */}
      <div className="w-full @[40rem]:w-1/3 font-medium text-sm mb-[0.25rem] @[40rem]:mb-0 text-muted-foreground">
        {change.attribute || "General"}
      </div>

      {/* Values */}
      <div className="w-full @[40rem]:w-2/3 flex flex-col @[40rem]:flex-row items-start @[40rem]:items-center gap-[0.5rem] text-sm">
        {/* Description Only Case */}
        {change.description && !change.before_value && !change.after_value ? (
          <span className="text-foreground">{change.description}</span>
        ) : (
          <>
            {/* Before Value */}
            {change.before_value && (
              <span className="line-through text-muted-foreground opacity-70">
                {change.before_value}
              </span>
            )}

            {/* Arrow */}
            {change.before_value && change.after_value && (
              <ArrowRight className="h-4 w-4 text-muted-foreground mx-[0.25rem] hidden @[40rem]:block" />
            )}

            {/* After Value */}
            {change.after_value && (
              <span
                className={cn(
                  "font-semibold",
                  isBuff
                    ? "text-red-600 dark:text-red-400"
                    : isNerf
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-yellow-600 dark:text-yellow-400",
                )}
              >
                {change.after_value}
              </span>
            )}

            {/* Description appended if exists */}
            {change.description && (
              <span className="text-xs text-muted-foreground ml-[0.5rem]">
                ({change.description})
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
