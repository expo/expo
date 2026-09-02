// @ref llp/0004-smart-start-and-project-state.rfc.md §Decision table
// @ref llp/0011-impact-and-freshness.rfc.md §The record has to hold the sources
// The "fingerprint matches last build" input of the decision table, and the base of an `impact`
// comparison.
//
// v1 cannot ask a device what it has installed, and it does not query remote build caches.
// What it can know is which fingerprint the last build *it ran* was made from, so it records
// that per platform in `.expo/agent-cli-last-build.json`. The file is advisory: a missing,
// corrupt, or unwritable record only makes a plan include a build it may not have needed.
//
// **v2 stores the whole fingerprint, not only its hash.** A hash answers "is the last build
// stale" and nothing else; `fingerprint:diff` needs both sides' `sources` to say *what* changed,
// which is the question the impact headline of `@expo/agent-cli status` exists to answer. The read is backwards compatible in
// the one direction that matters — a v1 value is a bare string, and it reads as a record whose
// `sources` are `null`, which every consumer already has to handle for a failed fingerprint.

import fs from 'fs';
import path from 'path';

import type { FingerprintSource } from '../project/fingerprint';
import { ensureDotExpoProjectDirectoryInitialized } from '../utils/dotExpo';
import { debugEvent } from './events';
import type { LastBuildFingerprints, NativePlatform } from './types';

/** Name of the record inside the project's `.expo` directory. */
export const LAST_BUILD_FILE_NAME = 'agent-cli-last-build.json';

const PLATFORMS: NativePlatform[] = ['ios', 'android'];

/** What one platform's last build was made from. */
export interface LastBuildFingerprint {
  hash: string;
  /**
   * The sources the hash was computed from, or `null` when only a hash was recorded.
   *
   * `null` for a record written by a version of this CLI that stored a bare string, and for a
   * build whose fingerprint run produced no sources. A comparison against such a record can still
   * say *whether* the native surface changed; it cannot say what changed, and `impact` reports
   * that limit rather than guessing.
   */
  sources: FingerprintSource[] | null;
}

/** The whole record, per platform. */
export type LastBuildRecord = Partial<Record<NativePlatform, LastBuildFingerprint>>;

function getLastBuildFilePath(projectRoot: string): string {
  return path.join(projectRoot, '.expo', LAST_BUILD_FILE_NAME);
}

/**
 * Read the whole record of the project's last development builds.
 *
 * Never throws: an unreadable or unexpected record reads as "nothing recorded", which plans a
 * build instead of failing the command.
 */
export function readLastBuildRecord(projectRoot: string): LastBuildRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(getLastBuildFilePath(projectRoot), 'utf8'));
  } catch {
    return {};
  }

  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }

  const record = parsed as Record<string, unknown>;
  const fingerprints: LastBuildRecord = {};
  for (const platform of PLATFORMS) {
    const entry = parseEntry(record[platform]);
    if (entry) {
      fingerprints[platform] = entry;
    }
  }
  return fingerprints;
}

/**
 * One platform's value, in either shape.
 *
 * A bare string is the v1 spelling and reads as a hash with no sources. An object is v2; its
 * `sources` are taken only when they are an array, so a truncated write degrades to the v1 answer
 * rather than to a diff against a broken list.
 */
function parseEntry(value: unknown): LastBuildFingerprint | null {
  if (typeof value === 'string') {
    return value ? { hash: value, sources: null } : null;
  }
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const entry = value as { hash?: unknown; sources?: unknown };
  if (typeof entry.hash !== 'string' || !entry.hash) {
    return null;
  }
  return {
    hash: entry.hash,
    sources: Array.isArray(entry.sources) ? (entry.sources as FingerprintSource[]) : null,
  };
}

/**
 * Read the fingerprint hashes recorded for the project's last development builds.
 *
 * The shape the plan engine and `status` have always read: the freshness question is a hash
 * comparison, and neither of them has anything to do with the sources.
 */
export function readLastBuildFingerprints(projectRoot: string): LastBuildFingerprints {
  const record = readLastBuildRecord(projectRoot);
  const fingerprints: LastBuildFingerprints = {};
  for (const platform of PLATFORMS) {
    const entry = record[platform];
    if (entry) {
      fingerprints[platform] = entry.hash;
    }
  }
  return fingerprints;
}

/**
 * Record what the platform was last built from, keeping the other platform's entry.
 *
 * Best-effort by design: this runs after a successful build, and a project whose `.expo`
 * directory cannot be written must not see that build reported as a failure.
 *
 * @param fingerprint the hash alone, or the whole fingerprint so a later `impact` can diff it.
 */
export function recordLastBuildFingerprint(
  projectRoot: string,
  platform: NativePlatform,
  fingerprint: string | LastBuildFingerprint
): void {
  try {
    const entry: LastBuildFingerprint =
      typeof fingerprint === 'string' ? { hash: fingerprint, sources: null } : fingerprint;
    const record = { ...readLastBuildRecord(projectRoot), [platform]: entry };
    ensureDotExpoProjectDirectoryInitialized(projectRoot);
    // Not pretty-printed. A real project's fingerprint is tens of thousands of bytes of sources
    // (an SDK 57 Expo Router app measures ~25 KB for iOS and ~30 KB for android [observed —
    // 2026-08-24]), and indenting it is a third again of that for a file nobody reads by hand.
    fs.writeFileSync(getLastBuildFilePath(projectRoot), JSON.stringify(record) + '\n');
  } catch (error) {
    debugEvent('last_build_record_failed', { error: debugEvent.error(error as Error) });
  }
}
