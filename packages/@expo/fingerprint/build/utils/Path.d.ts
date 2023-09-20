import minimatch from 'minimatch';
/**
 * Indicate the given `filePath` should be excluded by `ignorePaths`
 */
export declare function isIgnoredPath(filePath: string, ignorePaths: string[], minimatchOptions?: minimatch.IOptions): boolean;
