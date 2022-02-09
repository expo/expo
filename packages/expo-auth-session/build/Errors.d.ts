import { CodedError } from 'expo-modules-core';
/**
 * Server response error.
 */
export interface ResponseErrorConfig extends Record<string, any> {
    /**
     * Error code
     */
    error: string;
    /**
     * Additional message
     */
    error_description?: string;
    /**
     * URI for more info on the error
     */
    error_uri?: string;
}
export interface AuthErrorConfig extends ResponseErrorConfig {
    /**
     * Required only if state is used in the initial request
     */
    state?: string;
}
/**
 * [Section 4.1.2.1](https://tools.ietf.org/html/rfc6749#section-4.1.2.1)
 */
export declare class ResponseError extends CodedError {
    /**
     * Used to assist the client developer in
     * understanding the error that occurred.
     */
    description?: string;
    /**
     * A URI identifying a human-readable web page with
     * information about the error, used to provide the client
     * developer with additional information about the error.
     */
    uri?: string;
    /**
     * Raw results of the error.
     */
    params: Record<string, string>;
    constructor(params: ResponseErrorConfig, errorCodeType: string);
}
/**
 * Represents an authorization response error: [Section 5.2](https://tools.ietf.org/html/rfc6749#section-5.2).
 * Often times providers will fail to return the proper error message for a given error code.
 * This error method will add the missing description for more context on what went wrong.
 */
export declare class AuthError extends ResponseError {
    /**
     * Required only if state is used in the initial request
     */
    state?: string;
    constructor(response: AuthErrorConfig);
}
/**
 * [Section 4.1.2.1](https://tools.ietf.org/html/rfc6749#section-4.1.2.1)
 */
export declare class TokenError extends ResponseError {
    constructor(response: ResponseErrorConfig);
}
//# sourceMappingURL=Errors.d.ts.map