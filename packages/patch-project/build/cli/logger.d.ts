export declare const log: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
export declare const error: {
    (...data: any[]): void;
    (message?: any, ...optionalParams: any[]): void;
};
/** Print an error and provide additional info (the stack trace) in debug mode. */
export declare function exception(e: Error): void;
/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export declare function exit(message: string | Error, code?: number): never;
