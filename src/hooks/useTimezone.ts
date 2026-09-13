"use client";

import { useCallback, useMemo } from "react";
import { useMemory, useCreateMemoryFact, useUpdateMemoryFact } from "./useMemory";
import {
  TIMEZONE_FACT_KEY,
  resolveTimezone,
  type TimezoneSource,
} from "@/lib/timezone";
import type { MemoryFactResponse } from "@/types/memory";

function isTimezoneFact(fact: MemoryFactResponse): boolean {
  return fact.key.trim().toLowerCase().replace(/[\s_-]/g, "") === "timezone";
}

export interface UseTimezoneResult {
  /** The zone the agent resolves against — `UTC` when unset or invalid. */
  timezone: string;
  source: TimezoneSource;
  /** What is actually stored, even if it's invalid, so Settings can show it. */
  storedValue: string | null;
  isLoading: boolean;
  isSaving: boolean;
  save: (timezone: string) => Promise<unknown>;
}

/**
 * The user's timezone, stored as a memory fact so the agent reads the same value
 * the UI displays.
 */
export function useTimezone(): UseTimezoneResult {
  const { data: facts, isLoading } = useMemory();
  const createFact = useCreateMemoryFact();
  const updateFact = useUpdateMemoryFact();

  const fact = useMemo(() => facts?.find(isTimezoneFact) ?? null, [facts]);
  const resolved = resolveTimezone(fact?.value);

  const save = useCallback(
    (timezone: string) =>
      fact
        ? updateFact.mutateAsync({ id: fact.id, data: { value: timezone } })
        : createFact.mutateAsync({
            key: TIMEZONE_FACT_KEY,
            value: timezone,
            source: "manual",
          }),
    [fact, createFact, updateFact]
  );

  return {
    timezone: resolved.timezone,
    source: resolved.source,
    storedValue: fact?.value ?? null,
    isLoading,
    isSaving: createFact.isPending || updateFact.isPending,
    save,
  };
}
