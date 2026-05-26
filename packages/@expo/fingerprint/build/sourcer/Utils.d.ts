import type { HashSource } from '../Fingerprint.types';
export declare function getFileBasedHashSourceAsync(projectRoot: string, filePath: string, reason: string): Promise<HashSource | null>;
/**
 * Resolve path aliases before computing relative hash source paths.
 * On Windows, temp paths can be passed as short paths like `RUNNER~1` while
 * autolinking returns the long real path, which makes `path.relative()` unstable.
 */
export declare function maybeGetRealPathAsync(filePath: string): Promise<string>;
/**
 * A version of `JSON.stringify` that keeps the keys sorted
 */
export declare function stringifyJsonSorted(target: any, space?: string | number | undefined): string;
/**
 * Transform absolute paths in JSON to relative paths based on the project root.
 */
export declare function relativizeJsonPaths(value: any, projectRoot: string): any;
