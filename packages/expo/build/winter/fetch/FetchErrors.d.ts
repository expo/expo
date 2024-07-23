export declare class NetworkFetchError extends Error {
    constructor(message: string, { cause, stack }?: {
        cause?: unknown;
        stack?: string;
    });
    static createFromError(error: Error): NetworkFetchError;
}
//# sourceMappingURL=FetchErrors.d.ts.map