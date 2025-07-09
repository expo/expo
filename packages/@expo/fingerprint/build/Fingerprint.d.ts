import type { Fingerprint, FingerprintDiffItem, Options } from './Fingerprint.types';
/**
 * Create a fingerprint for a project.
 * @example
 * ```js
 * const fingerprint = await createFingerprintAsync('/app');
 * console.log(fingerprint);
 * ```
 */
export declare function createFingerprintAsync(projectRoot: string, options?: Options): Promise<Fingerprint>;
/**
 * Create a native hash value for a project.
 *
 * @example
 * ```ts
 * const hash = await createProjectHashAsync('/app');
 * console.log(hash);
 * ```
 */
export declare function createProjectHashAsync(projectRoot: string, options?: Options): Promise<string>;
/**
 * Diff the fingerprint with the fingerprint of the provided project.
 *
 * @example
 * ```ts
 * // Create a fingerprint for the project
 * const fingerprint = await createFingerprintAsync('/app');
 *
 * // Make some changes to the project
 *
 * // Calculate the diff
 * const diff = await diffFingerprintChangesAsync(fingerprint, '/app');
 * console.log(diff);
 * ```
 */
export declare function diffFingerprintChangesAsync(fingerprint: Fingerprint, projectRoot: string, options?: Options): Promise<FingerprintDiffItem[]>;
/**
 * Diff two fingerprints. The implementation assumes that the sources are sorted.
 *
 * @example
 * ```ts
 * // Create a fingerprint for the project
 * const fingerprint = await createFingerprintAsync('/app');
 *
 * // Make some changes to the project
 *
 * // Create a fingerprint again
 * const fingerprint2 = await createFingerprintAsync('/app');
 * const diff = await diffFingerprints(fingerprint, fingerprint2);
 * console.log(diff);
 * ```
 */
export declare function diffFingerprints(fingerprint1: Fingerprint, fingerprint2: Fingerprint): FingerprintDiffItem[];
