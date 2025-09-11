export declare function format(sep: string, pathObject: {
    dir?: string;
    root?: string;
    base?: string;
    name?: string;
    ext?: string;
}): string;
export declare function resolve(...args: string[]): string;
export declare function normalize(path: string): string;
export declare function isAbsolute(path: string): boolean;
export declare function join(...args: string[]): string;
export declare function relative(from: string, to: string): string;
export declare function toNamespacedPath(path: string): string;
export declare function dirname(path: string): string;
export declare function basename(path: string, suffix?: string): string;
export declare function extname(path: string): string;
export declare function parse(path: string): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
};
export declare const sep = "/";
export declare const delimiter = ":";
//# sourceMappingURL=path.d.ts.map