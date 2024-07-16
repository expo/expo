import { dedupSources } from './Dedup';
import type { Fingerprint, FingerprintDiffItem, Options } from './Fingerprint.types';
import { normalizeOptionsAsync } from './Options';
import { compareSource, sortSources } from './Sort';
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
): Promise<FingerprintDiffItem[]> {
  const newFingerprint = await createFingerprintAsync(projectRoot, options);
  if (fingerprint.hash === newFingerprint.hash) {
    return [];
  }
  return diffFingerprints(fingerprint, newFingerprint);
}

/**
 * Differentiate two fingerprints with operation type.
 * The implementation is assumed that the sources are sorted.
 */
export function diffFingerprints(
  fingerprint1: Fingerprint,
  fingerprint2: Fingerprint
): FingerprintDiffItem[] {
  let index1 = 0;
  let index2 = 0;
  const diff: FingerprintDiffItem[] = [];

  while (index1 < fingerprint1.sources.length && index2 < fingerprint2.sources.length) {
    const source1 = fingerprint1.sources[index1];
    const source2 = fingerprint2.sources[index2];

    const compareResult = compareSource(source1, source2);
    if (compareResult === 0) {
      if (source1.hash !== source2.hash) {
        diff.push({ op: 'changed', source: source2 });
      }
      ++index1;
      ++index2;
    } else if (compareResult < 0) {
      diff.push({ op: 'removed', source: source1 });
      ++index1;
    } else {
      diff.push({ op: 'added', source: source2 });
      ++index2;
    }
  }

  while (index1 < fingerprint1.sources.length) {
    diff.push({ op: 'removed', source: fingerprint1.sources[index1] });
    ++index1;
  }
  while (index2 < fingerprint2.sources.length) {
    diff.push({ op: 'added', source: fingerprint2.sources[index2] });
    ++index2;
  }

  return diff;
}
