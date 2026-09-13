import type { CalendarApproval } from "@/types/approval";

/**
 * The backend resolves relative phrasing ("Wednesday at 3pm") against the user's
 * stored timezone and falls back to UTC when it is missing or invalid. The UI
 * mirrors that fallback exactly, so what the card shows is what gets booked.
 */
export const FALLBACK_TIMEZONE = "UTC";

/** The memory fact key the timezone is stored under. */
export const TIMEZONE_FACT_KEY = "timezone";

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

export type TimezoneSource = "stored" | "fallback";

export interface ResolvedTimezone {
  timezone: string;
  source: TimezoneSource;
}

export function resolveTimezone(
  stored: string | null | undefined
): ResolvedTimezone {
  const trimmed = stored?.trim();
  if (trimmed && isValidTimezone(trimmed)) {
    return { timezone: trimmed, source: "stored" };
  }
  return { timezone: FALLBACK_TIMEZONE, source: "fallback" };
}

/** Every zone the runtime knows, for the settings picker. */
export function supportedTimezones(): string[] {
  const withValues = Intl as typeof Intl & {
    supportedValuesOf?: (key: string) => string[];
  };
  try {
    const zones = withValues.supportedValuesOf?.("timeZone");
    if (zones?.length) return zones;
  } catch {
    // fall through
  }
  const fallback = [FALLBACK_TIMEZONE, browserTimezone()];
  return Array.from(new Set(fallback));
}

function safeFormat(
  iso: string,
  timezone: string,
  options: Intl.DateTimeFormatOptions
): string | null {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return null;
  try {
    return new Intl.DateTimeFormat(undefined, {
      ...options,
      timeZone: timezone,
    }).format(parsed);
  } catch {
    return null;
  }
}

/** A bare `YYYY-MM-DD` has no instant — format it without shifting the day. */
function formatDateOnly(value: string): string | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const parsed = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(parsed);
  } catch {
    return value;
  }
}

export function formatDuration(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  if (!rest) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${rest}m`;
}

export interface FormattedEventTime {
  /** Human date/time in the given zone, or null when the payload has none. */
  when: string | null;
  duration: string | null;
}

/**
 * Renders an event's time in `timezone` — not the browser's — so the caption
 * "Times shown in X" is always true of the numbers beside it.
 */
export function formatEventTime(
  action: Pick<
    CalendarApproval,
    "start" | "end" | "allDay" | "durationMinutes"
  >,
  timezone: string
): FormattedEventTime {
  const duration = formatDuration(action.durationMinutes);

  if (!action.start) return { when: null, duration };

  if (action.allDay) {
    const day = formatDateOnly(action.start);
    return { when: day ? `${day} · all day` : action.start, duration };
  }

  const startText = safeFormat(action.start, timezone, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  if (!startText) return { when: action.start, duration };

  const endText = action.end
    ? safeFormat(action.end, timezone, { hour: "numeric", minute: "2-digit" })
    : null;

  return {
    when: endText ? `${startText} – ${endText}` : startText,
    duration,
  };
}
