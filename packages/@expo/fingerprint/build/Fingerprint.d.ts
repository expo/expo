import type { Fingerprint, FingerprintDiffItem, Options } from './Fingerprint.types';
/**
 * Create a fingerprint from project
 */
export declare function createFingerprintAsync(projectRoot: string, options?: Options): Promise<Fingerprint>;
/**
 * Create a native hash value from project
 */
export declare function createProjectHashAsync(projectRoot: string, options?: Options): Promise<string>;
/**
 * Differentiate given `fingerprint` with the current project fingerprint state
 */
export declare function diffFingerprintChangesAsync(fingerprint: Fingerprint, projectRoot: string, options?: Options): Promise<FingerprintDiffItem[]>;
/**
 * Differentiate two fingerprints with operation type.
 * The implementation is assumed that the sources are sorted.
 */
export declare function diffFingerprints(fingerprint1: Fingerprint, fingerprint2: Fingerprint): FingerprintDiffItem[];
