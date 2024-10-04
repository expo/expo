/**
 * A fetch RequestInit compatible structure.
 */
export interface FetchRequestInit {
    body?: BodyInit;
    credentials?: RequestCredentials;
    headers?: HeadersInit;
    method?: string;
    signal?: AbortSignal;
    integrity?: string;
    keepalive?: boolean;
    mode?: RequestMode;
    referrer?: string;
    window?: any;
}
//# sourceMappingURL=fetch.types.d.ts.map