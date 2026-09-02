// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
// @ref llp/0011-impact-and-freshness.rfc.md §The build-cache lookup
//
// "Has anybody already built exactly this?" — the other half of the freshness question, and the
// one a `stale` line could not answer. `impact` has asked it since 2026-08-24; `status` could not,
// for two reasons that are both about cost and are answered differently:
//
// 1. **The hash `status` has is the wrong hash.** Its probe runs `fingerprint:generate` with no
//    `--platform`, which hashes both platforms at once — the right answer for freshness and a hash
//    no EAS build carries, because a build is made for one platform. Live, on the same working
//    tree: `031f6b0c…` for the project and `8ce1acfb…` for iOS [observed — apps/observe-tester,
//    2026-08-26]. Asking EAS therefore costs a *second* fingerprint run before the network call.
// 2. **The network call is not instant.** `eas build:list --fingerprint-hash …` measured
//    1.10–1.33 s over five live runs, hit and miss alike, against a warm CLI [observed — same
//    session]. `status` measures ~65 ms.
//
// So the network half is opt-in (`--explain`) and the **cache is always read**, because the cache
// is exact rather than approximate: the whole-project hash *dominates* the per-platform ones —
// `--platform` filters the same source list, so an unchanged project hash implies unchanged
// per-platform hashes — which makes the hash `status` already has a sound key for an answer about
// a hash it does not have. A hit costs one `readFileSync` and is as true as the lookup that wrote
// it. See the LLP section for the argument in full.

import fs from 'fs';
import path from 'path';

import { lookUpCachedBuildAsync, runnerDownloadNote } from '../impact/buildCache';
import type { CachedBuild } from '../impact/types';
import type { NativePlatform } from '../plan/types';
import { generateFingerprintAsync } from '../project/fingerprint';
import { ensureDotExpoProjectDirectoryInitialized } from '../utils/dotExpo';
import { mayDownloadEasCli, resolveEasCli, type EasCli } from '../utils/easCli';
import type { AuthStatus, BuildsStatus, PlatformBuild } from './types';

/** Platforms the section reports, in print order — the same two `freshness` reports. */
const PLATFORMS: NativePlatform[] = ['ios', 'android'];

/** Name of the record inside the project's `.expo` directory. */
export const EAS_BUILDS_FILE_NAME = 'agent-cli-eas-builds.json';

/**
 * How long one platform's lookup may take, fingerprint run and network call together.
 *
 * Generous, because it is only ever spent by a caller who asked for it: the two halves measured
 * 1.24 s and 1.10–1.33 s live, so a budget under about four seconds would abandon answers that were
 * on their way. Expiring costs the platform an answer (`unknown`), never the report.
 */
export const EAS_BUILD_LOOKUP_TIMEOUT_MS = 10_000;

/**
 * How long the same lookup gets when the EAS CLI has to be **downloaded** first.
 *
 * @ref llp/0015-backend-selection-and-config.rfc.md §Resolving the EAS CLI
 * In a project that does not pin `eas-cli`, the one rung is `npx --yes eas-cli@latest`: its first
 * run installs the package before the query starts, and every run asks the registry, which no budget
 * written for a warm CLI can cover. Two answers were possible and this section takes the *middle*
 * one [decided — 2026-08-27, wave 18]: a wider budget, still bounded, so the common case of a modest
 * install answers rather than expires — and never the minutes a cold install, or an unreachable
 * registry, can take, because `status` must not hang. A run that expires anyway says the download was
 * why, and the next run is warm. Only reached under `--explain`; a default `status` asks EAS nothing.
 *
 * A project that *pins* the CLI keeps the tighter budget above: the runner resolves it out of
 * `node_modules` without a network call at all.
 */
export const EAS_BUILD_RUNNER_TIMEOUT_MS = 45_000;

/** What was cached for one platform, and the working tree it was cached for. */
interface CachedEntry {
  /**
   * The whole-project fingerprint hash at the moment of the lookup — the cache key.
   *
   * Not the hash that was looked up. This is the one `status` recomputes for free on every run,
   * and it dominates the per-platform hash below, so matching it proves the answer still holds.
   */
  projectHash: string;
  /** The per-platform hash that was actually asked about, reported so the answer can be checked. */
  fingerprintHash: string;
  checkedAt: string;
  build: CachedBuild;
}

type EasBuildsRecord = Partial<Record<NativePlatform, CachedEntry>>;

export interface EasBuildsOptions {
  /** Whether this run may call EAS. False on every run without `--explain`. */
  lookUp: boolean;
  /**
   * What the auth section answered.
   *
   * A signed-out machine is never probed a second time: the answer is already in the report, and
   * spawning `eas build:list` to be told the same thing would cost a second or more to learn
   * nothing. `null` and `loggedIn: null` both mean nothing was established, so the lookup runs.
   */
  auth: AuthStatus | null;
  /** The whole-project fingerprint hash the freshness section computed. Null when there is none. */
  projectHash: string | null;
  /** Overrides {@link EAS_BUILD_LOOKUP_TIMEOUT_MS}, for tests. */
  timeoutMs?: number;
  /**
   * Whether the per-platform fingerprint below may come out of the project's `.expo` record.
   *
   * @see llp/0023-fingerprint-caching.rfc.md — this is the section that pays for *two* of the three
   * fingerprints a `status --explain` used to compute, so it is the one the cache helps most.
   */
  fingerprintCache?: boolean;
}

/**
 * What EAS already has for this project, per platform.
 *
 * Reads the cache always and calls EAS only under `--explain`. Never throws: every way of not
 * getting an answer is an `unknown` carrying the reason, so a section that could not be read costs
 * one line of the report and the command still exits 0.
 */
export async function readEasBuildsStatusAsync(
  projectRoot: string,
  options: EasBuildsOptions
): Promise<BuildsStatus> {
  const record = readEasBuildsRecord(projectRoot);
  // Once for the whole section rather than once per platform: the answer cannot differ between them,
  // and the two rungs it may take both touch the filesystem. It is also what lets the deadline below
  // say *why* a lookup ran out of time.
  const easCli = options.lookUp ? resolveEasCli(projectRoot) : null;
  const platforms = await Promise.all(
    PLATFORMS.map((platform) => readPlatformAsync(projectRoot, platform, record, options, easCli))
  );
  return { askedEas: options.lookUp, platforms };
}

async function readPlatformAsync(
  projectRoot: string,
  platform: NativePlatform,
  record: EasBuildsRecord,
  options: EasBuildsOptions,
  easCli: EasCli | null
): Promise<PlatformBuild> {
  const cached = record[platform];
  if (cached && options.projectHash && cached.projectHash === options.projectHash) {
    return found(platform, cached.fingerprintHash, cached.build, 'cache');
  }

  if (!options.lookUp) {
    // Short on purpose: this is the reason on every platform of every default run, and the cost it
    // is short about is spelled out in `status --help`, which is where somebody weighing it looks.
    return unknown(platform, null, 'EAS was not asked — pass --explain');
  }
  if (options.auth?.loggedIn === false) {
    // The answer is already in the report. A second probe would spend a second to be told the
    // same thing, and this section must never be the reason a signed-out machine waits.
    return unknown(
      platform,
      null,
      `this machine is not signed in to Expo (per ${options.auth.source ?? 'the auth check'}), so EAS has nothing to answer with`
    );
  }

  const deadline =
    options.timeoutMs ??
    (mayDownloadEasCli(easCli) ? EAS_BUILD_RUNNER_TIMEOUT_MS : EAS_BUILD_LOOKUP_TIMEOUT_MS);
  const outcome = await withDeadlineAsync(
    lookUpPlatformAsync(projectRoot, platform, deadline, easCli, options.fingerprintCache),
    deadline
  );
  if (!outcome) {
    return unknown(
      platform,
      null,
      `the lookup did not finish within ${deadline}ms${runnerDownloadNote(easCli)}`
    );
  }
  if (outcome.build) {
    writeEasBuildsEntry(projectRoot, platform, {
      projectHash: options.projectHash,
      fingerprintHash: outcome.fingerprintHash,
      build: outcome.build,
    });
    return found(platform, outcome.fingerprintHash, outcome.build, 'eas');
  }
  if (outcome.reason) {
    return unknown(platform, outcome.fingerprintHash, outcome.reason);
  }
  return {
    platform,
    state: 'none',
    fingerprintHash: outcome.fingerprintHash,
    buildId: null,
    createdAt: null,
    buildProfile: null,
    buildUrl: null,
    source: 'eas',
    reason: 'EAS has no finished build made from this fingerprint',
  };
}

/** One platform's network answer: the hash that was asked about, and what came back. */
interface LookupOutcome {
  fingerprintHash: string | null;
  build: CachedBuild | null;
  /** Set when nothing was established. A `none` has neither a build nor a reason. */
  reason: string | null;
}

/**
 * Hash this one platform, then ask EAS about that hash.
 *
 * Two subprocesses, in this order because the second needs the first's answer. The fingerprint run
 * is the one `status` does not otherwise make: its probe hashes both platforms together, and an
 * EAS build carries a per-platform hash, so the project hash cannot be handed to the lookup.
 */
async function lookUpPlatformAsync(
  projectRoot: string,
  platform: NativePlatform,
  timeoutMs: number,
  easCli: EasCli | null,
  fingerprintCache: boolean | undefined
): Promise<LookupOutcome> {
  const fingerprint = await generateFingerprintAsync(projectRoot, {
    platform,
    cache: fingerprintCache,
  });
  if (!fingerprint.hash) {
    return {
      fingerprintHash: null,
      build: null,
      reason: fingerprint.error ?? `the ${platform} fingerprint could not be computed`,
    };
  }

  const outcome = await lookUpCachedBuildAsync(easCli, projectRoot, platform, fingerprint.hash, {
    timeoutMs,
  });
  return {
    fingerprintHash: fingerprint.hash,
    build: outcome.state === 'found' ? outcome.build : null,
    reason: outcome.state === 'unknown' ? outcome.reason : null,
  };
}

function found(
  platform: NativePlatform,
  fingerprintHash: string | null,
  build: CachedBuild,
  source: 'cache' | 'eas'
): PlatformBuild {
  return {
    platform,
    state: 'found',
    fingerprintHash,
    buildId: build.id,
    createdAt: build.createdAt,
    buildProfile: build.buildProfile,
    buildUrl: build.buildUrl,
    source,
    reason: null,
  };
}

function unknown(
  platform: NativePlatform,
  fingerprintHash: string | null,
  reason: string
): PlatformBuild {
  return {
    platform,
    state: 'unknown',
    fingerprintHash,
    buildId: null,
    createdAt: null,
    buildProfile: null,
    buildUrl: null,
    source: null,
    reason,
  };
}

function getRecordPath(projectRoot: string): string {
  return path.join(projectRoot, '.expo', EAS_BUILDS_FILE_NAME);
}

/**
 * Read the project's record of builds EAS was found to have.
 *
 * Never throws: a missing, corrupt or half-written record reads as nothing cached, which costs a
 * lookup rather than the command.
 */
export function readEasBuildsRecord(projectRoot: string): EasBuildsRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(getRecordPath(projectRoot), 'utf8'));
  } catch {
    return {};
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {};
  }

  const record = parsed as Record<string, unknown>;
  const entries: EasBuildsRecord = {};
  for (const platform of PLATFORMS) {
    const entry = parseEntry(record[platform]);
    if (entry) {
      entries[platform] = entry;
    }
  }
  return entries;
}

/**
 * One platform's entry, or null when it cannot be trusted.
 *
 * An entry without both hashes and a build id is dropped rather than repaired: the whole value of
 * this cache is that a hit is *exact*, and an entry that cannot name what it was true for is not.
 */
function parseEntry(value: unknown): CachedEntry | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  const build = entry.build;
  if (
    typeof entry.projectHash !== 'string' ||
    !entry.projectHash ||
    typeof entry.fingerprintHash !== 'string' ||
    !entry.fingerprintHash ||
    build == null ||
    typeof build !== 'object'
  ) {
    return null;
  }
  const cachedBuild = build as Record<string, unknown>;
  if (typeof cachedBuild.id !== 'string' || !cachedBuild.id) {
    return null;
  }
  return {
    projectHash: entry.projectHash,
    fingerprintHash: entry.fingerprintHash,
    checkedAt: typeof entry.checkedAt === 'string' ? entry.checkedAt : '',
    build: {
      id: cachedBuild.id,
      status: readString(cachedBuild.status),
      platform: readString(cachedBuild.platform),
      buildProfile: readString(cachedBuild.buildProfile),
      createdAt: readString(cachedBuild.createdAt),
      buildUrl: readString(cachedBuild.buildUrl),
    },
  };
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

/**
 * Record a build EAS was found to have, keeping the other platform's entry.
 *
 * **Only a hit is written.** A `none` goes out of date on the ordinary timeline of the workflow
 * this exists to serve — you start a build, it finishes fifteen minutes later, and a cached "there
 * is no build" would then be wrong every time it mattered. A hit only goes out of date when
 * somebody deletes a build, and the download command says so when they have.
 *
 * Best-effort, like every other `.expo` record: a project whose `.expo` cannot be written loses a
 * cache, not a report.
 */
export function writeEasBuildsEntry(
  projectRoot: string,
  platform: NativePlatform,
  entry: { projectHash: string | null; fingerprintHash: string | null; build: CachedBuild }
): void {
  // Nothing to key the entry on is nothing to cache: an entry that cannot say which working tree
  // it was true for could only ever be believed by guessing.
  if (!entry.projectHash || !entry.fingerprintHash || !entry.build.id) {
    return;
  }
  try {
    const record = {
      ...readEasBuildsRecord(projectRoot),
      [platform]: {
        projectHash: entry.projectHash,
        fingerprintHash: entry.fingerprintHash,
        checkedAt: new Date().toISOString(),
        build: entry.build,
      },
    };
    ensureDotExpoProjectDirectoryInitialized(projectRoot);
    fs.writeFileSync(getRecordPath(projectRoot), JSON.stringify(record, null, 2) + '\n');
  } catch {
    // A cache that could not be written is a lookup next time, which is the state this started in.
  }
}

/** Await a promise, resolving to null when it takes longer than `timeoutMs`. */
async function withDeadlineAsync<T>(work: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
    timer.unref?.();
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
