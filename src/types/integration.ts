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
}
