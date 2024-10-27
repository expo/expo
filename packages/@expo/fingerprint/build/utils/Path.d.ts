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
 * Indicate the given `filePath` should be excluded by the prebuilt `matchObjects`.
 */
export declare function isIgnoredPathWithMatchObjects(filePath: string, matchObjects: IMinimatch[]): boolean;
