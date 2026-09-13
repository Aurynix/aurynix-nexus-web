import type { SSEInterrupt } from "@/types/chat";
import type {
  ApprovalKind,
  CalendarApproval,
  EmailApproval,
  PendingAction,
} from "@/types/approval";

/**
 * Normalises an `interrupt` event into something the approval card can render.
 *
 * The wire format is read defensively on purpose: the backend may nest the
 * action under `action`/`payload`/`data`, may name fields Google-style
 * (`summary`, `dateTime`) or plainly (`title`, `start`), and older deployments
 * send nothing but the `question` string. Anything we can't recognise degrades
 * to a generic approval rather than throwing away the pause.
 */

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return null;
}

function pick(source: Dict, keys: string[]): unknown {
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function pickStr(source: Dict, keys: string[]): string | null {
  return str(pick(source, keys));
}

function toList(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) =>
        isDict(item)
          ? str(pick(item, ["email", "address", "value", "name"]))
          : str(item)
      )
      .filter((value): value is string => Boolean(value));
  }
  const single = str(raw);
  if (!single) return [];
  return single
    .split(/[,;]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function pickList(source: Dict, keys: string[]): string[] {
  return toList(pick(source, keys));
}

/**
 * Flattens one level of nesting so `{tool: "send_email", args: {to: …}}` and a
 * flat `{tool: "send_email", to: …}` read the same. Outer keys win, since the
 * envelope is the more specific description of the action.
 */
function flatten(source: Dict): Dict {
  const nestedKeys = [
    "args",
    "arguments",
    "input",
    "tool_input",
    "params",
    "parameters",
    "event",
    "email",
    "message",
    "details",
    "fields",
  ];
  let merged: Dict = {};
  for (const key of nestedKeys) {
    const nested = source[key];
    if (isDict(nested)) merged = { ...merged, ...nested };
  }
  return { ...merged, ...source };
}

/** The dictionary describing the action, wherever the backend put it. */
function locatePayload(event: SSEInterrupt): Dict | null {
  const candidates = [event.action, event.payload, event.data];
  for (const candidate of candidates) {
    if (isDict(candidate)) return flatten(candidate);
  }
  const self = event as unknown as Dict;
  const hasOwnFields = ["to", "subject", "body", "summary", "start", "tool"].some(
    (key) => self[key] !== undefined
  );
  return hasOwnFields ? flatten(self) : null;
}

/** Every string in the payload that might name the action, lowercased. */
function actionLabel(payload: Dict): string {
  return ["type", "kind", "action", "tool", "tool_name", "operation", "name"]
    .map((key) => str(payload[key]) ?? "")
    .join(" ")
    .toLowerCase();
}

function detectKind(label: string, payload: Dict): ApprovalKind | null {
  if (/calendar|event|meeting|appointment/.test(label)) return "calendar";
  if (/mail|email|message|reply|send/.test(label)) return "email";
  if (payload.subject !== undefined || payload.to !== undefined) return "email";
  if (payload.summary !== undefined || payload.start !== undefined) {
    return "calendar";
  }
  return null;
}

interface ParsedTime {
  iso: string | null;
  allDay: boolean;
  timezone: string | null;
}

/** Accepts an ISO string, a bare date, or Google's `{dateTime, date, timeZone}`. */
function readTime(raw: unknown): ParsedTime {
  if (isDict(raw)) {
    const dateTime = pickStr(raw, ["dateTime", "date_time", "datetime"]);
    const date = pickStr(raw, ["date"]);
    return {
      iso: dateTime ?? date,
      allDay: !dateTime && Boolean(date),
      timezone: pickStr(raw, ["timeZone", "time_zone", "timezone"]),
    };
  }
  const value = str(raw);
  if (!value) return { iso: null, allDay: false, timezone: null };
  return {
    iso: value,
    allDay: /^\d{4}-\d{2}-\d{2}$/.test(value),
    timezone: null,
  };
}

function readDurationMinutes(payload: Dict): number | null {
  const explicit = pick(payload, [
    "duration_minutes",
    "durationMinutes",
    "length_minutes",
  ]);
  if (typeof explicit === "number" && Number.isFinite(explicit)) {
    return Math.round(explicit);
  }
  const asText = str(pick(payload, ["duration"]));
  if (asText) {
    const minutes = Number.parseInt(asText, 10);
    if (Number.isFinite(minutes)) {
      return /hour|hr|\bh\b/i.test(asText) ? minutes * 60 : minutes;
    }
  }
  return null;
}

function minutesBetween(start: string | null, end: string | null): number | null {
  if (!start || !end) return null;
  const from = Date.parse(start);
  const to = Date.parse(end);
  if (Number.isNaN(from) || Number.isNaN(to) || to <= from) return null;
  return Math.round((to - from) / 60000);
}

function buildEmail(payload: Dict, label: string, raw: string): EmailApproval {
  return {
    kind: "email",
    operation: /reply|respond/.test(label) ? "reply" : "send",
    to: pickList(payload, ["to", "recipients", "recipient", "to_addresses"]),
    cc: pickList(payload, ["cc"]),
    bcc: pickList(payload, ["bcc"]),
    subject: pickStr(payload, ["subject", "title"]),
    body: pickStr(payload, ["body", "text", "content", "message_body"]) ?? "",
    raw,
  };
}

function buildCalendar(
  payload: Dict,
  label: string,
  raw: string
): CalendarApproval {
  const start = readTime(pick(payload, ["start", "start_time", "starts_at"]));
  const end = readTime(pick(payload, ["end", "end_time", "ends_at"]));

  const operation: CalendarApproval["operation"] = /delete|cancel|remove/.test(
    label
  )
    ? "delete"
    : /update|move|reschedule|edit|patch|change/.test(label)
      ? "update"
      : "create";

  return {
    kind: "calendar",
    operation,
    title: pickStr(payload, ["summary", "title", "event_title", "name"]),
    start: start.iso,
    end: end.iso,
    allDay: start.allDay || end.allDay,
    durationMinutes:
      readDurationMinutes(payload) ?? minutesBetween(start.iso, end.iso),
    timezone:
      pickStr(payload, ["timezone", "time_zone", "timeZone"]) ??
      start.timezone ??
      end.timezone,
    location: pickStr(payload, ["location", "where"]),
    attendees: pickList(payload, ["attendees", "guests", "participants"]),
    description: pickStr(payload, ["description", "notes", "body"]),
    raw,
  };
}

/**
 * Last resort for backends that only send prose: the documented question format
 * puts RFC-style headers above a blank line, which is enough to rebuild an email
 * card. Anything else stays generic — guessing at a calendar event from free
 * text would risk showing the user times that aren't what gets booked.
 */
function parseEmailFromText(question: string): EmailApproval | null {
  const headerMatch = question.match(/^\s*(to|cc|bcc|subject)\s*:/im);
  if (!headerMatch) return null;

  const lines = question.split(/\r?\n/);
  const headers: Dict = {};
  const bodyLines: string[] = [];
  let inBody = false;
  let sawHeader = false;

  for (const line of lines) {
    if (inBody) {
      bodyLines.push(line);
      continue;
    }
    const header = line.match(/^\s*(to|cc|bcc|subject)\s*:\s*(.*)$/i);
    if (header) {
      sawHeader = true;
      headers[header[1].toLowerCase()] = header[2];
      continue;
    }
    // A blank line after the header block starts the body; anything before the
    // first header is the agent's lead-in ("Send this email?") and is dropped.
    if (sawHeader && !line.trim()) inBody = true;
  }

  return {
    kind: "email",
    operation: /\breply\b/i.test(question) ? "reply" : "send",
    to: toList(headers.to),
    cc: toList(headers.cc),
    bcc: toList(headers.bcc),
    subject: str(headers.subject),
    body: bodyLines.join("\n").trim(),
    raw: question,
  };
}

export function parsePendingAction(event: SSEInterrupt): PendingAction {
  const question = event.question ?? "";
  const payload = locatePayload(event);

  if (payload) {
    const label = [actionLabel(payload), str(event.tool) ?? ""]
      .join(" ")
      .toLowerCase();
    const kind = detectKind(label, payload);
    if (kind === "email") return buildEmail(payload, label, question);
    if (kind === "calendar") return buildCalendar(payload, label, question);
  }

  const fromText = parseEmailFromText(question);
  if (fromText) return fromText;

  return {
    kind: "generic",
    question,
    hint: /calendar|event|meeting|appointment/i.test(question)
      ? "calendar"
      : /email|mail|inbox/i.test(question)
        ? "email"
        : null,
    raw: question,
  };
}
