export interface GoogleAuthorizeResponse {
  url: string;
  state: string;
}

export interface GoogleStatusResponse {
  connected: boolean;
  scopes: string[];
  /**
   * The Google account the connection belongs to. Optional — backends that
   * don't report it simply show no address.
   */
  email?: string | null;
  /** Alias some backends use for the same value. */
  google_email?: string | null;
  /**
   * One entry per connected Google product (backend v1.4.0+). Read through
   * `normalizeCapabilities` — the entry shape is not pinned down yet, so it is
   * typed loosely on purpose.
   */
  capabilities?: unknown;
}
