import type { Directory, ExpoFile } from '../FileSystem';
export declare class PathUtilities {
    /**
     * Joins path segments into a single path.
     * @param paths - An array of path segments.
     * @returns A string representing the joined path.
     */
    static join(...paths: (string | ExpoFile | Directory)[]): string;
    /**
     * Resolves a relative path to an absolute path.
     * @param from - The base path.
     * @param to - The relative path.
     * @returns A string representing the resolved path.
     */
    static relative(from: string | ExpoFile | Directory, to: string | ExpoFile | Directory): string;
    /**
     * Checks if a path is absolute.
     * @param path - The path to check.
     * @returns `true` if the path is absolute, `false` otherwise.
     */
    static isAbsolute(path: string | ExpoFile | Directory): boolean;
    /**
     * Normalizes a path.
     * @param path - The path to normalize.
     * @returns A string representing the normalized path.
     */
    static normalize(path: string | ExpoFile | Directory): string;
    /**
     * Returns the directory name of a path.
     * @param path - The path to get the directory name from.
     * @returns A string representing the directory name.
     */
    static dirname(path: string | ExpoFile | Directory): string;
    /**
     * Returns the base name of a path.
     * @param path - The path to get the base name from.
     * @param ext - An optional file extension.
     * @returns A string representing the base name.
     */
    static basename(path: string | ExpoFile | Directory, ext?: string): string;
    /**
     * Returns the extension of a path.
     * @param path - The path to get the extension from.
     * @returns A string representing the extension.
     */
    static extname(path: string | ExpoFile | Directory): string;
    /**
     * Parses a path into its components.
     * @param path - The path to parse.
     * @returns An object containing the parsed path components.
     */
    static parse(path: string | ExpoFile | Directory): {
        root: string;
        dir: string;
        base: string;
        ext: string;
        name: string;
    };
}
//# sourceMappingURL=index.d.ts.map