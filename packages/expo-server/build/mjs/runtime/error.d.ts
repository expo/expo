export declare class StatusError extends Error {
    status: number;
    body: string;
    constructor(status?: number, body?: {
        error?: string;
        [key: string]: any;
    } | Error | string);
    constructor(status?: number, errorOptions?: {
        cause: unknown;
        error?: string;
    });
    constructor(status?: number, body?: {
        error?: string;
        [key: string]: any;
    } | Error | string, errorOptions?: {
        cause?: unknown;
    });
}
export declare function errorToResponse(error: Error): Response;
