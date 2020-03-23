export declare const URL: {
    new (url: string, base?: string | URL | undefined): URL;
    prototype: URL;
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
};
export declare const URLSearchParams: {
    new (init?: string | URLSearchParams | string[][] | Record<string, string> | undefined): URLSearchParams;
    prototype: URLSearchParams;
};
