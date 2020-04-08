import { CodedError } from '@unimodules/core';
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
export interface AuthResultErrorConfig extends ResponseErrorConfig {
    /**
     * Required only if state is used in the initial request
     */
    state?: string;
}
/**
 * Extends https://tools.ietf.org/html/rfc6749#section-4.1.2.1
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
 * Extends https://tools.ietf.org/html/rfc6749#section-4.1.2.1
 */
export declare class TokenResponseError extends ResponseError {
    constructor(response: ResponseErrorConfig);
}
/**
 * Extends https://tools.ietf.org/html/rfc6749#section-5.2
 */
export declare class AuthResultError extends ResponseError {
    /**
     * Required only if state is used in the initial request
     */
    state?: string;
    constructor(response: AuthResultErrorConfig);
}
