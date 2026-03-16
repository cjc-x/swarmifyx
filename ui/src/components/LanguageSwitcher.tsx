import { type ComponentProps, useState } from "react";
import { Check, Languages } from "lucide-react";
import { useI18n } from "../context/I18nContext";
import { cn } from "../lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type LanguageSwitcherProps = {
  disablePortal?: boolean;
  align?: ComponentProps<typeof PopoverContent>["align"];
  side?: ComponentProps<typeof PopoverContent>["side"];
  sideOffset?: number;
  triggerClassName?: string;
  contentClassName?: string;
};

export function LanguageSwitcher({
  disablePortal = false,
  align = "end",
  side,
  sideOffset = 10,
  triggerClassName,
  contentClassName,
}: LanguageSwitcherProps) {
  const { locale, localeOptions, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  if (localeOptions.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("Language")}
          title={t("Language")}
          className={cn(
            "group inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/60 text-muted-foreground shadow-sm backdrop-blur-sm transition-all hover:border-foreground/20 hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            triggerClassName,
          )}
        >
          <Languages className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        disablePortal={disablePortal}
        align={align}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "w-44 rounded-2xl border-border/70 bg-background/92 p-1.5 shadow-xl backdrop-blur-xl",
          contentClassName,
        )}
      >
        <div className="px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {t("Language")}
        </div>
        <div className="space-y-1">
          {localeOptions.map((option) => {
            const selected = locale === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setLocale(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-sm transition-colors",
                  selected
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span>{option.nativeLabel}</span>
                {selected ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
