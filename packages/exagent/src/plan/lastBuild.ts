// @ref llp/0004-smart-start-and-project-state.rfc.md §Decision table
// The "fingerprint matches last build" input of the decision table.
//
// v1 cannot ask a device what it has installed, and it does not query remote build caches.
// What it can know is which fingerprint the last build *it ran* was made from, so it records
// that hash per platform in `.expo/exagent-last-build.json`. The file is advisory: a missing,
// corrupt, or unwritable record only makes a plan include a build it may not have needed.

import fs from 'fs';
import path from 'path';

import { ensureDotExpoProjectDirectoryInitialized } from '../utils/dotExpo';
import { debugEvent } from './events';
import type { LastBuildFingerprints, NativePlatform } from './types';

/** Name of the record inside the project's `.expo` directory. */
export const LAST_BUILD_FILE_NAME = 'exagent-last-build.json';

const PLATFORMS: NativePlatform[] = ['ios', 'android'];

function getLastBuildFilePath(projectRoot: string): string {
  return path.join(projectRoot, '.expo', LAST_BUILD_FILE_NAME);
}

/**
 * Read the fingerprint hashes recorded for the project's last development builds.
 *
 * Never throws: an unreadable or unexpected record reads as "nothing recorded", which plans a
 * build instead of failing the command.
 */
export function readLastBuildFingerprints(projectRoot: string): LastBuildFingerprints {
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
  const fingerprints: LastBuildFingerprints = {};
  for (const platform of PLATFORMS) {
    const hash = record[platform];
    if (typeof hash === 'string' && hash) {
      fingerprints[platform] = hash;
    }
  }
  return fingerprints;
}

/**
 * Record the fingerprint the platform was last built from, keeping the other platform's hash.
 *
 * Best-effort by design: this runs after a successful build, and a project whose `.expo`
 * directory cannot be written must not see that build reported as a failure.
 */
export function recordLastBuildFingerprint(
  projectRoot: string,
  platform: NativePlatform,
  hash: string
): void {
  try {
    const fingerprints = { ...readLastBuildFingerprints(projectRoot), [platform]: hash };
    ensureDotExpoProjectDirectoryInitialized(projectRoot);
    fs.writeFileSync(
      getLastBuildFilePath(projectRoot),
      JSON.stringify(fingerprints, null, 2) + '\n'
    );
  } catch (error) {
    debugEvent('last_build_record_failed', { error: debugEvent.error(error as Error) });
  }
}
