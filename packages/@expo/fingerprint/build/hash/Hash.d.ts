import pLimit from 'p-limit';
import type { Fingerprint, FingerprintSource, HashResult, HashSource, HashSourceContents, NormalizedOptions } from '../Fingerprint.types';
/**
 * Create a `Fingerprint` from `HashSources` array
 */
export declare function createFingerprintFromSourcesAsync(sources: HashSource[], projectRoot: string, options: NormalizedOptions): Promise<Fingerprint>;
/**
 * Create a `FingerprintSource` from a `HashSource`
 * This function will get a hash value and merge back to original source
 */
export declare function createFingerprintSourceAsync(source: HashSource, limiter: pLimit.Limit, projectRoot: string, options: NormalizedOptions): Promise<FingerprintSource>;
/**
 * Create a `HashResult` from a file
 */
export declare function createFileHashResultsAsync(filePath: string, limiter: pLimit.Limit, projectRoot: string, options: NormalizedOptions): Promise<HashResult | null>;
/**
 * Create `HashResult` for a dir.
 * If the dir is excluded, returns null rather than a HashResult
 */
export declare function createDirHashResultsAsync(dirPath: string, limiter: pLimit.Limit, projectRoot: string, options: NormalizedOptions, depth?: number): Promise<HashResult | null>;
/**
 * Create `HashResult` for a `HashSourceContents`
 */
export declare function createContentsHashResultsAsync(source: HashSourceContents, options: NormalizedOptions): Promise<HashResult>;
/**
 * Create id from given source
 */
export declare function createSourceId(source: HashSource): string;
