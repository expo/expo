/** Internal errors class to indicate that the server has failed
 * @remarks
 * This should be thrown for unexpected errors, so they show up as crashes.
 * Typically malformed project structure, missing manifest, html or other files.
 */
export declare class ExpoError extends Error {
    constructor(message: string);
    static isExpoError(error: unknown): error is ExpoError;
}
