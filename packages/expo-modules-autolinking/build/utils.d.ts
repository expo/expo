/** List filtered top-level files in `targetPath` (returns absolute paths) */
export declare function listFilesSorted(targetPath: string, filter: (basename: string) => boolean): Promise<string[]>;
/** List nested files in top-level directories in `targetPath` (returns relative paths) */
export declare function listFilesInDirectories(targetPath: string, filter: (basename: string) => boolean): Promise<string[]>;
/** Iterate folders recursively for files, optionally sorting results and filtering directories */
export declare function scanFilesRecursively(parentPath: string, includeDirectory?: (parentPath: string, name: string) => boolean, sort?: boolean): AsyncGenerator<{
    readonly path: string;
    readonly parentPath: string;
    readonly name: string;
}, void, unknown>;
export declare const fileExistsAsync: (file: string) => Promise<string | null>;
export declare const fastJoin: (from: string, append: string) => string;
export declare const maybeRealpath: (target: string) => Promise<string | null>;
export type PackageJson = Record<string, unknown> & {
    name?: string;
    version?: string;
};
export declare const loadPackageJson: import("./memoize").MemoizableAsyncFn<any[], PackageJson | null>;
