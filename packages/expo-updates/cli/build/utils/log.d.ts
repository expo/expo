export declare function time(label?: string): void;
export declare function timeEnd(label?: string): void;
export declare function error(...message: string[]): void;
/** Print an error and provide additional info (the stack trace) in debug mode. */
export declare function exception(e: Error): void;
export declare function warn(...message: string[]): void;
export declare function log(...message: string[]): void;
/** Clear the terminal of all text. */
export declare function clear(): void;
/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export declare function exit(message: string | Error, code?: number): never;
