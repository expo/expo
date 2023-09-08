import { dedupSources } from './Dedup';
import type { Fingerprint, FingerprintSource, Options } from './Fingerprint.types';
import { normalizeOptionsAsync } from './Options';
import { sortSources } from './Sort';
import { createFingerprintFromSourcesAsync } from './hash/Hash';
import { getHashSourcesAsync } from './sourcer/Sourcer';

/**
 * Create a fingerprint from project
 */
export async function createFingerprintAsync(
  projectRoot: string,
  options?: Options
): Promise<Fingerprint> {
  const opts = await normalizeOptionsAsync(projectRoot, options);
  const sources = await getHashSourcesAsync(projectRoot, opts);
  const normalizedSources = sortSources(dedupSources(sources, projectRoot));
  const fingerprint = await createFingerprintFromSourcesAsync(normalizedSources, projectRoot, opts);
  return fingerprint;
}

/**
 * Create a native hash value from project
 */
export async function createProjectHashAsync(
  projectRoot: string,
  options?: Options
): Promise<string> {
  const fingerprint = await createFingerprintAsync(projectRoot, options);
  return fingerprint.hash;
}

/**
 * Differentiate given `fingerprint` with the current project fingerprint state
 */
export async function diffFingerprintChangesAsync(
  fingerprint: Fingerprint,
  projectRoot: string,
  options?: Options
): Promise<FingerprintSource[]> {
  const newFingerprint = await createFingerprintAsync(projectRoot, options);
  if (fingerprint.hash === newFingerprint.hash) {
    return [];
  }
  return diffFingerprints(fingerprint, newFingerprint);
}

/**
 * Differentiate two fingerprints
 */
export function diffFingerprints(
  fingerprint1: Fingerprint,
  fingerprint2: Fingerprint
): FingerprintSource[] {
  return fingerprint2.sources.filter((newItem) => {
    return !fingerprint1.sources.find(
      (item) => item.type === newItem.type && item.hash === newItem.hash
    );
  });
}
