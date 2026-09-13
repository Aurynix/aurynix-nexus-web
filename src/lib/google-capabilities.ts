import type { GoogleStatusResponse } from "@/types/integration";

/**
 * Which Google products the connection actually covers.
 *
 * Backend v1.4.0 added a `capabilities` array to `/oauth/google/status` — one
 * entry per product — because deriving this from `scopes` listed every product
 * twice ("Gmail, Gmail, Google Calendar, Google Calendar"): two scopes map to
 * one product. The shape of an entry isn't pinned down yet, so both a plain
 * string and an object are accepted, and older backends still fall back to
 * `scopes` — de-duplicated, so the doubled labels are gone either way.
 */
export interface GoogleCapability {
  id: string;
  label: string;
  /**
   * What the user actually granted, e.g. "read and send". Shown verbatim: a
   * read-only Gmail grant must never read as though mail can be sent.
   */
  access: string | null;
}

const PRODUCT_LABELS: Record<string, string> = {
  gmail: "Gmail",
  mail: "Gmail",
  calendar: "Google Calendar",
  drive: "Google Drive",
  contacts: "Google Contacts",
  profile: "Profile",
  email: "Email",
};

/** Title-cases anything we don't recognise rather than hiding it. */
function labelFor(id: string): string {
  const key = id.trim().toLowerCase();
  for (const [needle, label] of Object.entries(PRODUCT_LABELS)) {
    if (key === needle || key.includes(needle)) return label;
  }
  return id
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readEntry(entry: unknown): GoogleCapability | null {
  if (typeof entry === "string") {
    const id = entry.trim();
    return id ? { id, label: labelFor(id), access: null } : null;
  }
  if (typeof entry === "object" && entry !== null && !Array.isArray(entry)) {
    const record = entry as Record<string, unknown>;
    const pick = (keys: string[]): string | null => {
      for (const key of keys) {
        const value = record[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return null;
    };
    const id = pick(["id", "key", "name", "product", "slug"]);
    const label = pick(["label", "title", "display_name", "displayName"]);
    if (!id && !label) return null;
    const resolvedId = id ?? label!;
    return {
      id: resolvedId,
      label: label ?? labelFor(resolvedId),
      access: pick(["access", "description", "granted"]),
    };
  }
  return null;
}

/** Sign-in scopes name no product — listing "Openid" as one is just noise. */
function isIdentityScope(scope: string): boolean {
  const key = scope.toLowerCase();
  return key === "openid" || key.includes("userinfo");
}

/** `calendar.events` and `calendar.readonly` are both the calendar product. */
function productFromScope(scope: string): string | null {
  const key = scope.toLowerCase();
  for (const needle of Object.keys(PRODUCT_LABELS)) {
    if (key.includes(needle)) return needle;
  }
  const parts = scope.split(/[./]/).filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

export function normalizeCapabilities(
  status: Pick<GoogleStatusResponse, "capabilities" | "scopes"> | undefined
): GoogleCapability[] {
  const seen = new Set<string>();
  const result: GoogleCapability[] = [];

  const push = (capability: GoogleCapability | null) => {
    if (!capability) return;
    const dedupeKey = (capability.id || capability.label).toLowerCase();
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);
    result.push(capability);
  };

  if (Array.isArray(status?.capabilities)) {
    for (const entry of status.capabilities) push(readEntry(entry));
    if (result.length) return result;
  }

  for (const scope of status?.scopes ?? []) {
    if (isIdentityScope(scope)) continue;
    const product = productFromScope(scope);
    if (product) push({ id: product, label: labelFor(product), access: null });
  }
  return result;
}
