export declare function time(label?: string): void;
export declare function timeEnd(label?: string): void;
export declare function error(...message: string[]): void;
export declare function warn(...message: string[]): void;
export declare function log(...message: string[]): void;
/** Log a message and exit the current process. If the `code` is non-zero then `console.error` will be used instead of `console.log`. */
export declare function exit(message: string, code?: number): never;
