import minimatch, { type IMinimatch } from 'minimatch';
/**
 * Indicate the given `filePath` should be excluded by the `ignorePaths`.
 */
export declare function isIgnoredPath(filePath: string, ignorePaths: string[], minimatchOptions?: minimatch.IOptions): boolean;
/**
 * Prebuild match objects for `isIgnoredPathWithMatchObjects` calls.
 */
export declare function buildPathMatchObjects(paths: string[], minimatchOptions?: minimatch.IOptions): IMinimatch[];
/**
 * Build an ignore match objects for directories based on the given `ignorePathMatchObjects`.
 */
export declare function buildDirMatchObjects(ignorePathMatchObjects: IMinimatch[], minimatchOptions?: minimatch.IOptions): IMinimatch[];
/**
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
export declare function isIgnoredPathWithMatchObjects(filePath: string, matchObjects: IMinimatch[]): boolean;
/**
 * Normalize the given `filePath` to be used for matching against `ignorePaths`.
 *
 * @param filePath The file path to normalize.
 * @param options.stripParentPrefix
 *   When people use fingerprint inside a monorepo, they may get source files from parent directories.
 *   However, minimatch '**' doesn't match the parent directories.
 *   We need to strip the `../` prefix to match the node_modules from parent directories.
 */
export declare function normalizeFilePath(filePath: string, options: {
    stripParentPrefix?: boolean;
}): string;
/**
 * Convert any platform-specific path to a POSIX path.
 */
export declare function toPosixPath(filePath: string): string;
