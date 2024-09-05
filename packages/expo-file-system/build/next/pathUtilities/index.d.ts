export declare function join(...paths: string[]): string;
export declare function relative(from: string, to: string): string;
export declare function isAbsolute(path: string): boolean;
export declare function normalize(path: string): string;
export declare function dirname(path: string): string;
export declare function basename(path: string, ext?: string): string;
export declare function parse(path: string): {
    root: string;
    dir: string;
    base: string;
    ext: string;
    name: string;
};
//# sourceMappingURL=index.d.ts.map