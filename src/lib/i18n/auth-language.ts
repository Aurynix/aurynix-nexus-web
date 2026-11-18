"use client";

import { useSyncExternalStore } from "react";
import { AUTH_MESSAGES, type AuthLanguage } from "./auth-messages";

/**
 * The language of the sign-in and sign-up pages, saved in the browser.
 *
 * Only these pages are translated, so the choice deliberately stays here: the
 * app itself is English-only, and right-to-left English would be worse than
 * either language on its own.
 */

const STORAGE_KEY = "aurynix-language";
const listeners = new Set<() => void>();

// The choice made in this tab. It also keeps the switch working when storage is
// blocked, since then nothing can be read back.
let chosen: AuthLanguage | null = null;

function readLanguage(): AuthLanguage {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    // Storage can be blocked (private windows, strict settings).
    return "en";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changing the language should change this one too.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    chosen = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setAuthLanguage(language: AuthLanguage) {
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Not saved, but the switch below still applies for this visit.
  }
  chosen = language;
  listeners.forEach((listener) => listener());
}

function getSnapshot(): AuthLanguage {
  return chosen ?? readLanguage();
}

export function useAuthLanguage() {
  // English on the server: the saved choice only exists in the browser.
  const language = useSyncExternalStore<AuthLanguage>(subscribe, getSnapshot, () => "en");
  return {
    language,
    dir: language === "ar" ? ("rtl" as const) : ("ltr" as const),
    t: AUTH_MESSAGES[language],
    setLanguage: setAuthLanguage,
  };
}
