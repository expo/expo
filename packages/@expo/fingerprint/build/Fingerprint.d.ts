import type { Fingerprint, FingerprintSource, Options } from './Fingerprint.types';
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
export declare function diffFingerprintChangesAsync(fingerprint: Fingerprint, projectRoot: string, options?: Options): Promise<FingerprintSource[]>;
/**
 * Differentiate two fingerprints
 */
export declare function diffFingerprints(fingerprint1: Fingerprint, fingerprint2: Fingerprint): FingerprintSource[];
