import type { Fingerprint, FingerprintSource } from '@expo/fingerprint';
import fs from 'fs';
import path from 'path';

import { event } from './events';

export type FingerprintModule = typeof import('@expo/fingerprint');

export type ResolvedFingerprint = {
  Fingerprint: FingerprintModule;
  /** Version of the resolved `@expo/fingerprint` package, when determinable. */
  version: string | null;
};

/**
 * Fingerprint source `reasons` that affect the output of `expo prebuild`. Other sources
 * (autolinking results, patches, eas.json, package.json scripts) change the native build
 * without making the generated android/ios directories stale.
 *
 * TODO: these literals are copied from `@expo/fingerprint` (inline strings in `src/sourcer/*`;
 * no exported constants exist). Export a `SourceReasons` vocabulary from that package and check
 * this list against it with a type-only import — the CLI must not import `@expo/fingerprint`
 * at runtime (devDependency; the real package is resolved from the user's project).
 * Until then, the `fingerprintVersion` guard in `getPrebuildStaleness` degrades a vocabulary
 * change to `unknown` instead of a wrong verdict.
 */
export const PREBUILD_RELEVANT_REASONS: readonly string[] = [
  'expoConfig',
  'expoConfigPlugins',
  'expoConfigExternalFile',
  'expoCNGPatches',
];

export type PrebuildFingerprintMarker = {
  version: 1;
  platform: 'android' | 'ios';
  hash: string;
  sources: FingerprintSource[];
  fingerprintVersion: string | null;
  createdAt: string;
};

/**
 * Options for computing the fingerprint that `needs-rebuild` compares. The prebuild marker and
 * the check side must use identical options, and they must match the build-time embed in
 * `expo-constants/scripts/createFingerprintFile.js` — a different hash on any side makes
 * `npx expo needs-rebuild` report a permanent mismatch.
 */
export function nativeFingerprintOptions(platform: 'android' | 'ios'): {
  platforms: ('android' | 'ios')[];
  silent: true;
} {
  return { platforms: [platform], silent: true };
}

/**
 * Resolve `@expo/fingerprint` from the project (via the `expo` package's `./fingerprint`
 * re-export) so the hash matches the one computed at build time (the expo-constants build
 * phase resolves `expo/fingerprint` from the project too). This feature ships with the `expo`
 * version that introduces the re-export, so there is no older `expo` install to fall back for.
 * Returns null when the project has no resolvable fingerprint package.
 */
export function importFingerprint(projectRoot: string): ResolvedFingerprint | null {
  let modulePath: string;
  try {
    modulePath = require.resolve('expo/fingerprint', { paths: [projectRoot] });
  } catch {
    return null;
  }
  // Only a resolution failure means "not installed". A load failure (a corrupted install, an
  // ESM-only build) throws here so it doesn't get misreported as a missing package.
  return {
    Fingerprint: require(modulePath),
    version: resolveFingerprintVersion(modulePath),
  };
}

function resolveFingerprintVersion(fingerprintModulePath: string): string | null {
  try {
    return require(
      require.resolve('@expo/fingerprint/package.json', {
        paths: [path.dirname(fingerprintModulePath)],
      })
    ).version;
  } catch {
    return null;
  }
}

export function getPrebuildFingerprintMarkerPath(
  projectRoot: string,
  platform: 'android' | 'ios'
): string {
  return path.join(projectRoot, '.expo', 'prebuild', `fingerprint-${platform}.json`);
}

/** Read the marker written by the last `expo prebuild`. Returns null when missing or invalid. */
export function readPrebuildFingerprintMarker(
  projectRoot: string,
  platform: 'android' | 'ios'
): PrebuildFingerprintMarker | null {
  try {
    const marker = JSON.parse(
      fs.readFileSync(getPrebuildFingerprintMarkerPath(projectRoot, platform), 'utf8')
    );
    if (
      marker?.version !== 1 ||
      marker.platform !== platform ||
      typeof marker.hash !== 'string' ||
      !Array.isArray(marker.sources)
    ) {
      return null;
    }
    return marker;
  } catch {
    return null;
  }
}

/**
 * Compute the project fingerprint and record it as the prebuild marker for the platform.
 * Runs after `expo prebuild` generates the native directories; `needs-rebuild` compares the
 * marker against the current project to detect stale directories. Never throws — the marker
 * is optional metadata and must not fail prebuild.
 */
export async function recordPrebuildFingerprintAsync(
  projectRoot: string,
  platform: 'android' | 'ios',
  resolved: ResolvedFingerprint | null = importFingerprintSilently(projectRoot)
): Promise<PrebuildFingerprintMarker | null> {
  if (!resolved) {
    event('fingerprint_marker_skipped', {});
    return null;
  }
  try {
    const fingerprint: Fingerprint = await resolved.Fingerprint.createFingerprintAsync(
      projectRoot,
      nativeFingerprintOptions(platform)
    );
    const marker: PrebuildFingerprintMarker = {
      version: 1,
      platform,
      hash: fingerprint.hash,
      sources: fingerprint.sources,
      fingerprintVersion: resolved.version,
      createdAt: new Date().toISOString(),
    };
    const markerPath = getPrebuildFingerprintMarkerPath(projectRoot, platform);
    fs.mkdirSync(path.dirname(markerPath), { recursive: true });
    fs.writeFileSync(markerPath, JSON.stringify(marker));
    return marker;
  } catch (error: any) {
    event('fingerprint_marker_failed', { error: event.error(error as Error) });
    return null;
  }
}

function importFingerprintSilently(projectRoot: string): ResolvedFingerprint | null {
  try {
    return importFingerprint(projectRoot);
  } catch (error: any) {
    event('fingerprint_import_failed', { error: event.error(error as Error) });
    return null;
  }
}

export function filterPrebuildSources(sources: FingerprintSource[]): FingerprintSource[] {
  return sources.filter((source) =>
    source.reasons.some((reason) => PREBUILD_RELEVANT_REASONS.includes(reason))
  );
}

export type PrebuildSourceChange = {
  /** Readable name of the fingerprint source, such as `app config` or `plugins/withFoo.js`. */
  source: string;
  change: 'added' | 'removed' | 'changed';
  /**
   * Whether the source belongs to the project or to an installed dependency. Only project
   * sources are named in messages — see `formatPrebuildChanges`.
   */
  scope: 'project' | 'dependency';
};

export type PrebuildStaleness = {
  status: 'fresh' | 'stale' | 'unknown';
  /** Sources that differ from the marker. Empty unless the status is `stale`. */
  changes: PrebuildSourceChange[];
};

export type NativeDirectoryStaleness = {
  status: 'fresh' | 'stale' | 'unknown' | 'not-applicable';
  changes: PrebuildSourceChange[];
};

/**
 * Staleness of the generated native directory for a platform, read from the prebuild marker.
 * `not-applicable` when the project has no native directory — nothing to regenerate. Shared by
 * `npx expo needs-rebuild` and the dev server so their verdicts cannot diverge.
 */
export function getNativeDirectoryStaleness(
  projectRoot: string,
  platform: 'android' | 'ios',
  current: { sources: FingerprintSource[]; fingerprintVersion: string | null }
): NativeDirectoryStaleness {
  if (!fs.existsSync(path.join(projectRoot, platform))) {
    return { status: 'not-applicable', changes: [] };
  }
  // A bare project has a native directory but no marker, which reads as `unknown` and falls
  // through to the plain rebuild advice.
  return getPrebuildStaleness({
    marker: readPrebuildFingerprintMarker(projectRoot, platform),
    currentSources: current.sources,
    currentFingerprintVersion: current.fingerprintVersion,
  });
}

/**
 * Commands that bring a stale installed app up to date, in order. When the generated native
 * directories are stale, a plain rebuild would compile them as-is and embed the new hash —
 * hiding the problem instead of fixing it — so `prebuild` has to run first.
 */
export function rebuildCommands(
  platform: 'android' | 'ios',
  { prebuildFirst }: { prebuildFirst: boolean }
): string[] {
  return prebuildFirst
    ? [`npx expo prebuild -p ${platform}`, `npx expo run:${platform}`]
    : [`npx expo run:${platform}`];
}

/**
 * Decide whether the generated native directories are stale relative to the current project,
 * and name the sources that made them stale — the answer to the question every stale verdict
 * raises. Compares only prebuild-relevant sources, so changes that autolinking picks up at
 * build time (new native dependencies, patches) don't report the directories as stale.
 */
export function getPrebuildStaleness({
  marker,
  currentSources,
  currentFingerprintVersion,
}: {
  marker: PrebuildFingerprintMarker | null;
  currentSources: FingerprintSource[];
  currentFingerprintVersion: string | null;
}): PrebuildStaleness {
  if (!marker) {
    return { status: 'unknown', changes: [] };
  }
  // Reason tags and hashing may change between fingerprint versions; don't guess.
  if (!marker.fingerprintVersion || marker.fingerprintVersion !== currentFingerprintVersion) {
    return { status: 'unknown', changes: [] };
  }
  const markerHashes = toSourceHashMap(filterPrebuildSources(marker.sources));
  const currentHashes = toSourceHashMap(filterPrebuildSources(currentSources));

  const changes: PrebuildSourceChange[] = [];
  for (const key of new Set([...markerHashes.keys(), ...currentHashes.keys()])) {
    const before = markerHashes.get(key);
    const after = currentHashes.get(key);
    if (before?.hash === after?.hash) {
      continue;
    }
    // Describe the source itself, never the map key: the key may be an `overrideHashKey`, which
    // exists to keep identity stable and is meaningless to a reader.
    const entry = after ?? before!;
    changes.push({
      ...describeSource(entry.source),
      change: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed',
    });
  }
  // Stable order across runs (source hash maps follow fingerprint traversal order), with project
  // sources first so the actionable ones survive message truncation.
  changes.sort((a, b) =>
    a.scope === b.scope ? a.source.localeCompare(b.source) : a.scope === 'project' ? -1 : 1
  );

  return { status: changes.length ? 'stale' : 'fresh', changes };
}

/**
 * Name the changed sources for a message, so a stale verdict answers "what changed?" on the
 * spot. Long lists are truncated; the full list stays in the structured result.
 *
 * Only project sources are named. A dependency path points at code the developer did not write,
 * and the remediation is the same either way, so naming it adds nothing to act on and invites a
 * wrong conclusion. Returns an empty string when nothing nameable changed — callers must drop
 * the clause rather than emit a sentence with a hole in it.
 */
export function formatPrebuildChanges(changes: PrebuildSourceChange[], max: number = 3): string {
  const project = changes.filter((change) => change.scope === 'project');
  const named = project.slice(0, max).map((change) => change.source);
  const remaining = project.length - named.length;
  return named.join(', ') + (remaining > 0 ? `, and ${remaining} more` : '');
}

/** Turn a fingerprint source into something a developer can act on. */
function describeSource(source: FingerprintSource): Pick<PrebuildSourceChange, 'source' | 'scope'> {
  if (source.type === 'contents') {
    return { source: source.id === 'expoConfig' ? 'app config' : source.id, scope: 'project' };
  }
  if (source.type === 'package') {
    return { source: `package ${source.name}`, scope: 'dependency' };
  }
  return {
    source: source.filePath,
    scope: isDependencyPath(source.filePath) ? 'dependency' : 'project',
  };
}

/**
 * Whether a fingerprint source path points outside the project. Paths are relative to the project
 * root, so a leading `..` means a linked workspace package in a monorepo, and `node_modules` means
 * an installed one.
 */
function isDependencyPath(filePath: string): boolean {
  const segments = filePath.split(/[\\/]/);
  return segments[0] === '..' || segments.includes('node_modules');
}

/**
 * Index sources by a stable identity so two fingerprints can be compared. `overrideHashKey` is
 * part of the key when set — that is its purpose, keeping a source identifiable when its path
 * varies between environments — so the source travels alongside its hash for anything that has
 * to describe it.
 */
function toSourceHashMap(
  sources: FingerprintSource[]
): Map<string, { hash: string; source: FingerprintSource }> {
  const map = new Map<string, { hash: string; source: FingerprintSource }>();
  for (const source of sources) {
    if (source.hash == null) {
      continue;
    }
    const key =
      source.type === 'contents'
        ? `contents:${source.id}`
        : source.type === 'package'
          ? `package:${source.overrideHashKey ?? source.name}`
          : `${source.type}:${source.overrideHashKey ?? source.filePath}`;
    map.set(key, { hash: source.hash, source });
  }
  return map;
}
