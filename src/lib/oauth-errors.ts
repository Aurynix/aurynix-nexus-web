/**
 * Human text for the `reason` codes the backend puts on its OAuth error
 * redirects. The raw codes are diagnostic strings — `invalid_state` tells a user
 * nothing about what to do next, and worst of all it usually means "you're on a
 * second attempt", not that anything is broken.
 */
const REASONS: Record<string, string> = {
  invalid_state:
    "That Google link has already been used or has expired. Start again from this page — don't reuse a back button or an old tab.",
  exchange_failed:
    "Google wouldn't complete the sign-in. Try again, and if it keeps failing check that this account is allowed to use the app.",
  access_denied: "You declined the permissions Google asked for.",
  no_account:
    "No Aurynix account is linked to that Google address. Create one first, then connect Google.",
  missing_code: "Google didn't send an authorization code back.",
};

export function describeOAuthReason(reason: string | null): string | null {
  if (!reason) return null;
  return REASONS[reason.trim().toLowerCase()] ?? reason;
}
