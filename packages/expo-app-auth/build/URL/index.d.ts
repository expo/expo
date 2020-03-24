export declare const URL: {
    new (url: string, base?: string | URL | undefined): URL;
    prototype: URL;
    createObjectURL(object: any): string;
    revokeObjectURL(url: string): void;
};
export declare const URLSearchParams: {
    new (init?: string | Record<string, string> | string[][] | URLSearchParams | undefined): URLSearchParams;
    prototype: URLSearchParams;
};
