/**
 * A fetch RequestInit compatible structure.
 */
export interface FetchRequestInit {
  body?: BodyInit | null;
  credentials?: RequestCredentials; // same-origin is not supported
  headers?: HeadersInit;
  method?: string;
  signal?: AbortSignal | null;
  redirect?: RequestRedirect;

  // Not supported fields
  integrity?: string;
  keepalive?: boolean;
  mode?: RequestMode;
  referrer?: string;
  window?: any;
}

/**
 * A fetch Request compatible structure.
 */
export interface FetchRequestLike {
  url: string;
  body: BodyInit | null;
  credentials?: RequestCredentials;
  method: string;
  signal?: AbortSignal;
  redirect?: RequestRedirect;
}
