/**
 * A fetch RequestInit compatible structure.
 */
export interface FetchRequestInit {
    body?: BodyInit | null;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    method?: string;
    signal?: AbortSignal | null;
    redirect?: RequestRedirect;
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
    readonly credentials?: RequestCredentials;
    readonly signal?: AbortSignal;
    readonly redirect?: RequestRedirect;
}
//# sourceMappingURL=fetch.types.d.ts.map