// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
// "A finished build already exists for this exact fingerprint" — a materially better answer than
// "you need a native build", and the thing that closes the "No build-cache lookup" approximation
// of llp/0004 §Implemented in v1 as, item 2.
//
// `eas build:list --fingerprint-hash <hash>` is what makes it possible [observed — eas-cli README,
// v22.2.0]. `--json` implies `--non-interactive` there; both are passed anyway, because the
// implication is the other CLI's and this one does not depend on it.

import type { EasCli } from '../utils/easCli';
import { spawnSubprocessAsync } from '../utils/subprocess';
import type { CachedBuild } from './types';

/** How long the lookup may take before it is abandoned. */
export const BUILD_CACHE_TIMEOUT_MS = 20_000;

/**
 * The argv of one build-cache lookup.
 *
 * Pinned by a unit test: `--status finished` is what makes a hit mean something — a queued or
 * errored build with the same fingerprint is not a build you can install — and `--limit 1` is what
 * keeps this cheap enough to run without asking.
 */
export function buildCacheArgs(platform: 'ios' | 'android', hash: string): string[] {
  return [
    'build:list',
    '--platform',
    platform,
    '--fingerprint-hash',
    hash,
    '--status',
    'finished',
    '--limit',
    '1',
    '--json',
    '--non-interactive',
  ];
}

/**
 * Look for a finished EAS build made from this exact fingerprint.
 *
 * **Never fails the command.** No EAS CLI, no account, no network, a payload in a shape this CLI
 * does not recognise — every one of them answers `null`, which is read as "no cached build was
 * found" and never as "there is none". `impact` exits 0 whatever happens here, because the report
 * it is decorating is complete without it.
 */
export async function findCachedBuildAsync(
  easCli: EasCli | null,
  projectRoot: string,
  platform: 'ios' | 'android',
  hash: string | null
): Promise<CachedBuild | null> {
  if (!easCli || !hash) {
    return null;
  }

  const result = await spawnSubprocessAsync(easCli.command, buildCacheArgs(platform, hash), {
    cwd: projectRoot,
    output: 'capture',
    timeoutMs: BUILD_CACHE_TIMEOUT_MS,
  });
  if (result.spawnError || result.timedOut || result.exitCode !== 0) {
    return null;
  }

  return parseCachedBuild(result.stdout);
}

/**
 * Read the first build out of an `eas build:list --json` payload.
 *
 * The command prints an array of `BuildFragment` [observed — eas-cli `build/list.ts` calls
 * `printJsonOnlyOutput` with the list]. Everything is optional here for the reason everything is
 * optional in `build:wait`'s parser: this is another CLI's payload across a process boundary, and
 * a field that moved must become `null` rather than throw.
 */
export function parseCachedBuild(stdout: string): CachedBuild | null {
  const start = stdout.indexOf('[');
  if (start < 0) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stdout.slice(start));
  } catch {
    return null;
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return null;
  }

  const build = parsed[0];
  if (build == null || typeof build !== 'object') {
    return null;
  }

  const record = build as Record<string, unknown>;
  const artifacts = record.artifacts as Record<string, unknown> | undefined;
  return {
    id: readString(record.id),
    status: readString(record.status),
    platform: readString(record.platform),
    buildProfile: readString(record.buildProfile),
    createdAt: readString(record.createdAt),
    buildUrl: readString(artifacts?.buildUrl),
  };
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}
