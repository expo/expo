import { Minimatch, type MinimatchOptions } from 'minimatch';
/**
 * Indicate the given `filePath` should be excluded by the `ignorePaths`.
 */
export declare function isIgnoredPath(filePath: string, ignorePaths: string[], minimatchOptions?: MinimatchOptions): boolean;
/**
 * Prebuild match objects for `isIgnoredPathWithMatchObjects` calls.
 */
export declare function buildPathMatchObjects(paths: string[], minimatchOptions?: MinimatchOptions): Minimatch[];
/**
 * Append a new ignore path to the given `matchObjects`.
 */
export declare function appendIgnorePath(matchObjects: Minimatch[], path: string, minimatchOptions?: MinimatchOptions): void;
/**
 * Build an ignore match objects for directories based on the given `ignorePathMatchObjects`.
 */
export declare function buildDirMatchObjects(ignorePathMatchObjects: Minimatch[], minimatchOptions?: MinimatchOptions): Minimatch[];
/**
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
export declare function isIgnoredPathWithMatchObjects(filePath: string, matchObjects: Minimatch[]): boolean;
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
/**
 * Check if the given `filePath` exists.
 */
export declare function pathExistsAsync(filePath: string): Promise<boolean>;
