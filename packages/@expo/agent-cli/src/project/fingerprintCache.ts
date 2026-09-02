// @ref llp/0023-fingerprint-caching.rfc.md §Layer 2 — the cross-run cache
// The record of fingerprints this project already computed, in `.expo/` beside the other records
// (`agent-cli-last-build.json`, `agent-cli-eas-builds.json`).
//
// The problem it solves is that `status --explain` computes three fingerprints — the whole project
// for the freshness headline, then iOS and android for the EAS build lookup — and the same three,
// unchanged, on the next run a minute later. Each costs about a second [observed — 1.09–1.10 s
// whole-project and 0.95 s per platform on a real SDK 57 app, 2026-08-27].
//
// A hit is only ever *reported* as a hit (llp/0021 §The rules): every consumer receives
// `source: 'cache'`, the kind of check that revalidated it, how many files it covered, and when the
// hash was computed — and the printed report says all four. The record self-expires, and that expiry
// carries more weight here than in most caches: it is the *only* bound on the two things the pinned
// files cannot see, a native edit under `ios/`/`android/` and an edit that preserved a file's size
// and modification time.

import fs from 'fs';
import path from 'path';

import { ensureDotExpoProjectDirectoryInitialized } from '../utils/dotExpo';
import { debugEvent } from './events';
import type { FingerprintSource } from './fingerprint';
import {
  buildFingerprintKeyManifestAsync,
  FINGERPRINT_KEY_KIND,
  manifestSize,
  manifestsMatch,
  type FingerprintKeyManifest,
} from './fingerprintKeys';
import { readJsonFileSync, resolvePackageRootSync } from './nodeModules';

/** Name of the record inside the project's `.expo` directory. */
export const FINGERPRINT_CACHE_FILE_NAME = 'agent-cli-fingerprint.json';

/**
 * Schema version of the record.
 *
 * Bumped whenever the pinned set or the digesting changes, because an entry written under the old
 * rules was revalidated against a different question. A record from another version is dropped
 * rather than migrated: the thing it holds is recomputable in a second.
 */
export const FINGERPRINT_CACHE_SCHEMA_VERSION = 2;

/**
 * How long an entry may be believed, however well its pinned files revalidate.
 *
 * **Ten minutes** [decided, 2026-08-27].
 *
 * This is the risk bound, not a housekeeping detail, and the number follows from what the manifest
 * gives up. It pins the sentinel files by size and modification time and does not look at `ios/` or
 * `android/` at all, so two real changes are invisible to it: a native edit, and an edit that
 * happened to preserve a file's size and timestamp. The TTL is the whole of what catches those.
 *
 * Ten minutes is the shortest window that still keeps the saving. The workflow this serves is an
 * agent loop that runs `status` many times while working on one change — those runs land seconds
 * apart, so they are all inside it — and ten minutes is comfortably shorter than the thing a wrong
 * answer would misdirect, which is a native build. An hour was the top of the range considered and
 * would let a morning's native edit be missed; a day, the value this shipped with while the manifest
 * still walked the native directories, is indefensible now that it does not.
 *
 * A caller who cannot accept even ten minutes passes `--no-fingerprint-cache`.
 */
export const FINGERPRINT_CACHE_TTL_MS = 10 * 60 * 1000;

/** What one cached fingerprint answers with. */
export interface FingerprintCacheHit {
  hash: string;
  sources: FingerprintSource[] | null;
  /** When the fingerprint CLI computed this hash, so a report never implies it was measured now. */
  computedAt: string;
  /** How old the entry is, in milliseconds, at the moment it was believed. */
  ageMs: number;
  /** How many pinned files the hit was checked against. */
  revalidatedAgainst: number;
  /** What kind of check that was, so the report cannot overstate it. */
  keyKind: string;
  /** What the check could not cover, carried through from the manifest. */
  uncovered: string[];
}

/** One entry as it sits on disk. */
interface CacheEntry {
  hash: string;
  sources: FingerprintSource[] | null;
  computedAt: string;
  /** The `@expo/fingerprint` version that produced the hash. A different one is a different hash. */
  cliVersion: string;
  keyManifest: FingerprintKeyManifest;
}

interface CacheRecord {
  version: number;
  entries: Record<string, CacheEntry>;
}

export interface FingerprintCacheKey {
  platform?: 'ios' | 'android';
  preset?: string;
  /** The project's `@expo/fingerprint` version, or null when it could not be read. */
  cliVersion: string | null;
}

/**
 * The entry key: the platform, the preset, and nothing else.
 *
 * The CLI version is checked rather than keyed on, so an upgrade *replaces* the entry instead of
 * accumulating one per version that ever ran here.
 */
export function fingerprintCacheKey({
  platform,
  preset,
}: Omit<FingerprintCacheKey, 'cliVersion'>): string {
  return `${platform ?? 'all'}|${preset ?? 'default'}`;
}

/**
 * The version of the `@expo/fingerprint` the project resolves.
 *
 * Read off the package rather than by running it: the CLI has no `--version` [observed — its
 * `package.json` `bin` is one entry with no version command], and spawning it to learn what a file
 * says would spend the second this cache exists to save.
 *
 * **Two lookups, because one directory is not where every install puts it** [F111, wave 27]. This
 * used to read the literal path `<projectRoot>/node_modules/@expo/fingerprint/package.json`, and a
 * null answer turns the whole cross-run cache off — so in the two monorepo shapes below the cache
 * was silently absent while the fingerprint CLI itself was found and spawned normally, which is an
 * asymmetry rather than a policy:
 *
 *  1. **A hoisted workspace** puts the package in an ancestor's `node_modules`, exactly as it puts
 *     the lockfile in an ancestor — which {@link FingerprintKeyManifest} already walks up for.
 *     {@link resolvePackageRootAsync} is that same walk.
 *  2. **pnpm's isolated store** puts it in no ancestor at all: it is a transitive dependency of
 *     `expo`, reachable only beside `expo` in the virtual store [observed — 2026-08-28, wave 27: a
 *     pnpm workspace app resolved it at `node_modules/.pnpm/@expo+fingerprint@0.20.10…`, and two
 *     consecutive `status` runs there both reported `source: "computed"` and wrote no record].
 *     So the second rung asks the same walk again, starting from `expo`'s own directory.
 *
 * Both rungs are file lookups rather than `require.resolve`, for the reason
 * {@link resolvePackageRootAsync} states: no project code may be executed to answer this.
 */
export function resolveFingerprintCliVersion(projectRoot: string): string | null {
  const direct = readPackageVersion(projectRoot, FINGERPRINT_PACKAGE_NAME);
  if (direct) {
    return direct;
  }
  const expoRoot = resolvePackageRootSync(projectRoot, 'expo');
  // Through the link rather than to it: under pnpm the project's `node_modules/expo` is a *symlink*
  // into the virtual store, and the walk has to continue from where the package really is or it
  // climbs back through the project and finds nothing.
  return expoRoot ? readPackageVersion(realPathOrSelf(expoRoot), FINGERPRINT_PACKAGE_NAME) : null;
}

/** A directory's real location, or the path itself when it cannot be resolved. */
function realPathOrSelf(directory: string): string {
  try {
    return fs.realpathSync(directory);
  } catch {
    return directory;
  }
}

/** The package whose version decides whether two hashes are comparable. */
const FINGERPRINT_PACKAGE_NAME = '@expo/fingerprint';

/** The `version` of one installed package, resolved from a directory, or null. */
function readPackageVersion(from: string, packageName: string): string | null {
  const packageRoot = resolvePackageRootSync(from, packageName);
  if (!packageRoot) {
    return null;
  }
  const manifest = readJsonFileSync<{ version?: unknown }>(path.join(packageRoot, 'package.json'));
  return typeof manifest?.version === 'string' && manifest.version ? manifest.version : null;
}

/**
 * The cached fingerprint for one key, when the project still looks the way it did.
 *
 * Never throws. A missing, corrupt, expired, or differently-keyed record all read as "nothing
 * cached", which costs a `fingerprint:generate` — the state this started in.
 */
export async function readFingerprintCacheAsync(
  projectRoot: string,
  options: FingerprintCacheKey & { manifest: FingerprintKeyManifest }
): Promise<FingerprintCacheHit | null> {
  const { manifest, cliVersion } = options;
  // Nothing to key on is nothing to trust: an entry that cannot name the CLI version that made it
  // could only be believed by guessing that the project's own version never moved.
  if (!cliVersion || !manifest.cacheable) {
    return null;
  }

  const record = readRecord(projectRoot);
  const entry = record?.entries[fingerprintCacheKey(options)];
  if (!entry || entry.cliVersion !== cliVersion) {
    return null;
  }

  const age = Date.now() - Date.parse(entry.computedAt);
  if (!Number.isFinite(age) || age < 0 || age > FINGERPRINT_CACHE_TTL_MS) {
    return null;
  }

  if (!manifestsMatch(entry.keyManifest, manifest)) {
    return null;
  }

  return {
    hash: entry.hash,
    sources: entry.sources,
    computedAt: entry.computedAt,
    ageMs: age,
    revalidatedAgainst: manifestSize(manifest),
    keyKind: FINGERPRINT_KEY_KIND,
    uncovered: manifest.uncovered,
  };
}

/**
 * Store one computed fingerprint, keeping the entries of every other key.
 *
 * Best-effort, like every other `.expo` record: a project whose `.expo` cannot be written loses a
 * cache, not an answer.
 *
 * **The manifest is read a second time here, and a write only happens when the two agree.** The
 * fingerprint CLI runs for about a second, and a file that changed while it ran would otherwise be
 * recorded as the state the hash was computed from — the one way this cache could hand back a hash
 * for a project that never had it.
 */
export function writeFingerprintCacheAsync(
  projectRoot: string,
  options: FingerprintCacheKey & {
    hash: string | null;
    sources: FingerprintSource[] | null;
    manifest: FingerprintKeyManifest;
  }
): Promise<void> {
  const { hash, cliVersion, manifest } = options;
  if (!hash || !cliVersion || !manifest.cacheable) {
    return Promise.resolve();
  }
  // Queued rather than started: one `status --explain` computes three fingerprints and two of them
  // finish together, and this record is one file holding all three. Two concurrent
  // read-modify-writes lose an entry at best and truncate the file at worst — which is how three
  // entries became none in an e2e run [observed — 2026-08-27, before this queue existed].
  const previous = writeQueue.get(projectRoot) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() => writeEntryAsync(projectRoot, { ...options, hash, cliVersion }));
  writeQueue.set(projectRoot, next);
  return next;
}

/**
 * One project's pending record writes, in order.
 *
 * Per process only. Two `@expo/agent-cli` processes writing at once are handled by the atomic rename
 * below: the loser's entry is dropped, which costs one recomputation, and neither can leave a
 * half-written file behind.
 */
const writeQueue = new Map<string, Promise<void>>();

async function writeEntryAsync(
  projectRoot: string,
  options: FingerprintCacheKey & {
    hash: string;
    cliVersion: string;
    sources: FingerprintSource[] | null;
    manifest: FingerprintKeyManifest;
  }
): Promise<void> {
  const { hash, sources, manifest, cliVersion } = options;
  const recordPath = getRecordPath(projectRoot);
  const temporaryPath = `${recordPath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    const after = await buildFingerprintKeyManifestAsync(projectRoot);
    if (!after.cacheable || !manifestsMatch(manifest, after)) {
      debugEvent('fingerprint_cache_skipped', {
        reason: 'project changed while hashing',
      });
      return;
    }

    const entries = readRecord(projectRoot)?.entries ?? {};
    const entry: CacheEntry = {
      hash,
      sources,
      computedAt: new Date().toISOString(),
      cliVersion,
      keyManifest: manifest,
    };
    ensureDotExpoProjectDirectoryInitialized(projectRoot);
    // Written to a temporary name and renamed over the record, because a reader is another process
    // running the same commands: a rename is atomic, and a plain write of tens of thousands of
    // bytes is a window in which the record parses as corrupt.
    //
    // Not pretty-printed, for the reason `agent-cli-last-build.json` is not: the `sources` of a real
    // project are tens of thousands of bytes and nobody reads this file by hand.
    await fs.promises.writeFile(
      temporaryPath,
      JSON.stringify({
        version: FINGERPRINT_CACHE_SCHEMA_VERSION,
        entries: { ...entries, [fingerprintCacheKey(options)]: entry },
      }) + '\n'
    );
    await fs.promises.rename(temporaryPath, recordPath);
  } catch (error) {
    await fs.promises.rm(temporaryPath, { force: true }).catch(() => {});
    debugEvent('fingerprint_cache_write_failed', {
      error: debugEvent.error(error as Error),
    });
  }
}

/** Drop the whole record, for a project whose cache can no longer be about anything. */
export function clearFingerprintCache(projectRoot: string): void {
  try {
    fs.rmSync(getRecordPath(projectRoot), { force: true });
  } catch {
    // A record that could not be removed is one more revalidation, which is what it is for.
  }
}

function getRecordPath(projectRoot: string): string {
  return path.join(projectRoot, '.expo', FINGERPRINT_CACHE_FILE_NAME);
}

/** The record, or null when there is nothing usable on disk. */
function readRecord(projectRoot: string): CacheRecord | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(getRecordPath(projectRoot), 'utf8'));
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const record = parsed as Record<string, unknown>;
  if (record.version !== FINGERPRINT_CACHE_SCHEMA_VERSION) {
    return null;
  }
  const entries: Record<string, CacheEntry> = {};
  if (record.entries && typeof record.entries === 'object' && !Array.isArray(record.entries)) {
    for (const [key, value] of Object.entries(record.entries as Record<string, unknown>)) {
      const entry = parseEntry(value);
      if (entry) {
        entries[key] = entry;
      }
    }
  }
  return { version: FINGERPRINT_CACHE_SCHEMA_VERSION, entries };
}

/**
 * One entry, or null when it cannot say what it was true for.
 *
 * The whole value of this cache is that a hit is checkable, and an entry missing its manifest, its
 * timestamp or its CLI version is not checkable. Such an entry is dropped rather than repaired.
 */
function parseEntry(value: unknown): CacheEntry | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const entry = value as Record<string, unknown>;
  if (
    typeof entry.hash !== 'string' ||
    !entry.hash ||
    typeof entry.computedAt !== 'string' ||
    typeof entry.cliVersion !== 'string' ||
    !entry.cliVersion
  ) {
    return null;
  }
  const manifest = parseManifest(entry.keyManifest);
  if (!manifest) {
    return null;
  }
  return {
    hash: entry.hash,
    sources: Array.isArray(entry.sources) ? (entry.sources as FingerprintSource[]) : null,
    computedAt: entry.computedAt,
    cliVersion: entry.cliVersion,
    keyManifest: manifest,
  };
}

function parseManifest(value: unknown): FingerprintKeyManifest | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const manifest = value as Record<string, unknown>;
  const { files } = manifest;
  if (files == null || typeof files !== 'object' || Array.isArray(files)) {
    return null;
  }
  return {
    files: files as Record<string, string>,
    cacheable: true,
    uncovered: Array.isArray(manifest.uncovered) ? (manifest.uncovered as string[]) : [],
  };
}
