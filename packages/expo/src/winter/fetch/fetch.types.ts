/**
 * A fetch RequestInit compatible structure.
 */
export interface FetchRequestInit {
  body?: BodyInit;
  credentials?: RequestCredentials; // same-origin is not supported
  headers?: HeadersInit;
  method?: string;
  signal?: AbortSignal;

  // Not supported fields
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
  referrer?: string;
  window?: any;
}
