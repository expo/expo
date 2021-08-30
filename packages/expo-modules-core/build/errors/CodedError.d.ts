/**
 * A general error class that should be used for all errors in Expo modules.
 * Guarantees a `code` field that can be used to differentiate between different
 * types of errors without further subclassing Error.
 */
export declare class CodedError extends Error {
    code: string;
    info?: any;
    constructor(code: string, message: string);
}
