export interface GoogleAuthorizeResponse {
  url: string;
  state: string;
}

export interface GoogleStatusResponse {
  connected: boolean;
  scopes: string[];
}
