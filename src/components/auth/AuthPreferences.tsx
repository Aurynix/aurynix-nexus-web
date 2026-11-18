"use client";

import { Languages } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuthLanguage } from "@/lib/i18n/auth-language";

/** Language and theme controls for the sign-in and sign-up pages. */
export function AuthPreferences() {
  const { language, t, setLanguage } = useAuthLanguage();

  return (
    <div className="absolute end-4 top-4 z-10 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLanguage(language === "ar" ? "en" : "ar")}
        aria-label={t.switchLanguageLabel}
        title={t.switchLanguageLabel}
        // The label is always in the *other* language, so set its own.
        lang={language === "ar" ? "en" : "ar"}
        className="flex h-8 items-center gap-1.5 rounded-[9px] border border-border px-2.5 text-[13px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <Languages className="h-4 w-4" aria-hidden="true" />
        {t.switchLanguage}
      </button>
      <ThemeToggle label={t.toggleTheme} />
    </div>
  );
}
