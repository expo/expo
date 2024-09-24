type Path = string | {
    uri: string;
};
export declare class PathUtilities {
    /**
     * Joins path segments into a single path.
     * @param paths - An array of path segments.
     * @returns A string representing the joined path.
     */
    static join(...paths: Path[]): string;
    /**
     * Resolves a relative path to an absolute path.
     * @param from - The base path.
     * @param to - The relative path.
     * @returns A string representing the resolved path.
     */
    static relative(from: Path, to: Path): string;
    /**
     * Checks if a path is absolute.
     * @param path - The path to check.
     * @returns `true` if the path is absolute, `false` otherwise.
     */
    static isAbsolute(path: Path): boolean;
    /**
     * Normalizes a path.
     * @param path - The path to normalize.
     * @returns A string representing the normalized path.
     */
    static normalize(path: Path): string;
    /**
     * Returns the directory name of a path.
     * @param path - The path to get the directory name from.
     * @returns A string representing the directory name.
     */
    static dirname(path: Path): string;
    /**
     * Returns the base name of a path.
     * @param path - The path to get the base name from.
     * @param ext - An optional file extension.
     * @returns A string representing the base name.
     */
    static basename(path: Path, ext?: string): string;
    /**
     * Returns the extension of a path.
     * @param path - The path to get the extension from.
     * @returns A string representing the extension.
     */
    static extname(path: Path): string;
    /**
     * Parses a path into its components.
     * @param path - The path to parse.
     * @returns An object containing the parsed path components.
     */
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