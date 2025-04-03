import type { HashSource } from '../Fingerprint.types';
export declare function getFileBasedHashSourceAsync(projectRoot: string, filePath: string, reason: string): Promise<HashSource | null>;
/**
 * A version of `JSON.stringify` that keeps the keys sorted
 */
export declare function stringifyJsonSorted(target: any, space?: string | number | undefined): string;
/**
 * Transform absolute paths in JSON to relative paths based on the project root.
 */
export declare function relativizeJsonPaths(value: any, projectRoot: string): any;
