import { ApiRequestError } from "@/lib/api/client";
import type { AuthMessages } from "./auth-messages";

/** `google` is finishing a Google sign-in; `googleStart` is the button that begins one. */
type AuthAction = "signin" | "signup" | "google" | "googleStart";

/**
 * A failed sign-in, sign-up or Google exchange, in the page's language.
 *
 * Chosen by HTTP status rather than by matching the server's English wording,
 * so a reworded backend message can't silently fall back to English. Anything
 * unrecognised gets the action's generic failure.
 */
export function describeAuthError(t: AuthMessages, err: unknown, action: AuthAction): string {
  const fallback =
    action === "signin"
      ? t.signInFailed
      : action === "signup"
        ? t.registerFailed
        : action === "googleStart"
          ? t.googleCouldNotStart
          : t.callbackCouldNotComplete;

  if (err instanceof ApiRequestError) {
    // No sign-in endpoint means the backend half isn't deployed.
    if (action === "googleStart" && (err.status === 404 || err.status === 501)) {
      return t.googleNotEnabled;
    }
    if (err.status === 401 && action === "signin") return t.invalidCredentials;
    if (err.status === 409 && action === "signup") return t.emailTaken;
    if (err.status === 429) return t.tooManyAttempts;
    // The only 422 the exchange returns is a spent or expired code.
    if (err.status === 422) return action === "google" ? t.callbackCodeExpired : t.invalidDetails;
    if (err.status >= 500) return t.serverError;
    return fallback;
  }

  // fetch rejects with a TypeError when the request never got a response.
  if (err instanceof TypeError) return t.networkError;

  return fallback;
}
