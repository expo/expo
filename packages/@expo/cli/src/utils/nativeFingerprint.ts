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
 * (autolinking, patches, eas.json, package.json scripts) change the native build without making
 * the generated directories stale.
 *
 * TODO: copied from `@expo/fingerprint`, which exports no vocabulary to check against.
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
 * Options every side must compute the fingerprint with: the marker here, and the build-time
 * embed in `expo-constants/scripts/createFingerprintFile.js`. Different options mean a
 * permanent mismatch.
 */
export function nativeFingerprintOptions(platform: 'android' | 'ios'): {
  platforms: ('android' | 'ios')[];
  silent: true;
} {
  return { platforms: [platform], silent: true };
}

/**
 * Resolve the fingerprint package through `expo/fingerprint`, the way the expo-constants build
 * phase resolves it, so both sides hash with the same copy. Null when the project has none.
 */
export function importFingerprint(projectRoot: string): ResolvedFingerprint | null {
  let modulePath: string;
  try {
    modulePath = require.resolve('expo/fingerprint', { paths: [projectRoot] });
  } catch {
    return null;
  }
  // Only a resolution failure means "not installed"; a load failure throws rather than reading
  // as a missing package.
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
 * Record what the native directories were generated from. Never throws: the marker is optional
 * metadata and must not fail prebuild.
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
 * Staleness of a platform's generated native directory, from the prebuild marker.
 * `not-applicable` when the project has no such directory: nothing to regenerate.
 */
export function getNativeDirectoryStaleness(
  projectRoot: string,
  platform: 'android' | 'ios',
  current: { sources: FingerprintSource[]; fingerprintVersion: string | null }
): NativeDirectoryStaleness {
  if (!fs.existsSync(path.join(projectRoot, platform))) {
    return { status: 'not-applicable', changes: [] };
  }
  // A bare project has a directory and no marker, which reads as `unknown`.
  return getPrebuildStaleness({
    marker: readPrebuildFingerprintMarker(projectRoot, platform),
    currentSources: current.sources,
    currentFingerprintVersion: current.fingerprintVersion,
  });
}

/**
 * Commands that bring a stale app up to date, in order. Stale directories need `prebuild`
 * first: a plain rebuild compiles them as they are and embeds the new hash, hiding the problem.
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
 * Compare the marker with the current project and name what moved. Only prebuild-relevant
 * sources count, so a new native dependency does not make the directories stale.
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
    if (before === after) {
      continue;
    }
    changes.push({
      source: describeSourceKey(key),
      change: before === undefined ? 'added' : after === undefined ? 'removed' : 'changed',
    });
  }
  // Stable order across runs: the hash maps follow fingerprint traversal order.
  changes.sort((a, b) => a.source.localeCompare(b.source));

  return { status: changes.length ? 'stale' : 'fresh', changes };
}

/** Name the changed sources for a message. Long lists are truncated. */
export function formatPrebuildChanges(changes: PrebuildSourceChange[], max: number = 3): string {
  const named = changes.slice(0, max).map((change) => change.source);
  const remaining = changes.length - named.length;
  return named.join(', ') + (remaining > 0 ? `, and ${remaining} more` : '');
}

/** Turn a `toSourceHashMap` key into something a developer can act on. */
function describeSourceKey(key: string): string {
  const separatorIndex = key.indexOf(':');
  const type = key.slice(0, separatorIndex);
  const id = key.slice(separatorIndex + 1);
  if (type === 'contents') {
    return id === 'expoConfig' ? 'app config' : id;
  }
  if (type === 'package') {
    return `package ${id}`;
  }
  return id;
}

function toSourceHashMap(sources: FingerprintSource[]): Map<string, string> {
  const map = new Map<string, string>();
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
    map.set(key, source.hash);
  }
  return map;
}
