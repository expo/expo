type Path = string | {
    uri: string;
};
export declare class PathUtilities {
    static join(...paths: Path[]): string;
    static relative(from: Path, to: Path): string;
    static isAbsolute(path: Path): boolean;
    static normalize(path: Path): string;
    static dirname(path: Path): string;
    static basename(path: Path, ext?: string): string;
    static extname(path: Path): string;
    static parse(path: Path): {
        root: string;
        dir: string;
        base: string;
        ext: string;
        name: string;
    };
}
export {};
//# sourceMappingURL=index.d.ts.map