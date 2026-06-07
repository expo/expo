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

  // These fields are accepted for `RequestInit` compatibility but ignored: `expo/fetch` does not
  // act on them, and they are not forwarded to the native request.
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
  readonly url: string;
  readonly body: BodyInit | null;
  readonly method: string;
  readonly headers: Headers;

  // Not always supported, marked as optional
  readonly credentials?: RequestCredentials;
  readonly signal?: AbortSignal;
  readonly redirect?: RequestRedirect;
}
