/**
 * General error, formatted as a message in red text when caught by expo-cli (no stack trace is printed). Should be used in favor of `log.error()` in most cases.
 */
export declare class CommandError extends Error {
    code: string;
    name: string;
    readonly isCommandError = true;
    constructor(code: string, message?: string);
}
export declare function logCmdError(error: any): never;
