import type { FingerprintSource } from '@expo/fingerprint';
import type { ChangeEvent } from '@expo/metro/metro-file-map';
import path from 'path';

import {
  formatPrebuildChanges,
  getNativeDirectoryStaleness,
  importFingerprint,
  nativeFingerprintOptions,
  rebuildCommands,
} from '../../../utils/nativeFingerprint';

export type FingerprintPlatform = 'android' | 'ios';

export type ServerFingerprint = {
  /** Current project fingerprint hash. */
  hash: string;
  /** Version of the project's `@expo/fingerprint` package, when determinable. */
  fingerprintVersion: string | null;
  /** Sources behind the hash, used to tell a stale app apart from stale native directories. */
  sources: FingerprintSource[];
};

export type FingerprintService = ReturnType<typeof createFingerprintService>;

/** Remediation for a stale installed app, shared by the terminal warning and the HTTP response. */
export type MismatchAdvice = {
  /** Human-readable explanation of the mismatch. */
  recommendation: string;
  /** Commands that bring the app up to date, in order. */
  commands: string[];
};

/** Explain a mismatch, from the shared staleness helpers so every verdict reads the same. */
function getMismatchAdvice(
  projectRoot: string,
  platform: FingerprintPlatform,
  server: ServerFingerprint
): MismatchAdvice {
  const prefix = `The installed ${platform} app does not match the project`;
  const { status, changes } = getNativeDirectoryStaleness(projectRoot, platform, server);
  if (status === 'stale') {
    // Empty when only a dependency changed, since dependency paths are not named.
    const named = formatPrebuildChanges(changes);
    return {
      recommendation: named
        ? `${prefix} — ${named} changed after the ${platform} directory was generated.`
        : `${prefix} — the generated ${platform} directory is out of date.`,
      commands: rebuildCommands(platform, { prebuildFirst: true }),
    };
  }
  return {
    recommendation: `${prefix} — native inputs changed since it was built.`,
    commands: rebuildCommands(platform, { prebuildFirst: false }),
  };
}

/**
 * Whether a watcher event can affect the fingerprint. `.expo` is excluded because the dev
 * server writes there on every manifest request, which would clear the cache before each launch.
 */
export function touchesFingerprintInputs(event: ChangeEvent, projectRoot: string): boolean {
  const stateDirPrefix = path.join(projectRoot, '.expo') + path.sep;
  const { addedFiles, modifiedFiles, removedFiles, addedDirectories, removedDirectories } =
    event.changes;
  function* changedPaths() {
    for (const [filePath] of addedFiles) yield filePath;
    for (const [filePath] of modifiedFiles) yield filePath;
    for (const [filePath] of removedFiles) yield filePath;
    yield* addedDirectories;
    yield* removedDirectories;
  }
  for (const changedPath of changedPaths()) {
    // Canonical watcher paths are relative to the watched root.
    const absolutePath = path.isAbsolute(changedPath)
      ? changedPath
      : path.join(event.rootDir, changedPath);
    if (!absolutePath.startsWith(stateDirPrefix)) {
      return true;
    }
  }
  return false;
}

/** One app launch warns once; the next launch warns again. */
const WARN_THROTTLE_MS = 10_000;

/**
 * Computes and caches the project fingerprint. The cache is required: apps announce on every
 * reload and an uncached computation costs 1 to 2.5 s of CPU. It holds the in-flight promise so
 * concurrent requests share one computation.
 */
export function createFingerprintService(
  projectRoot: string,
  { warn, now = Date.now }: { warn: (message: string) => void; now?: () => number }
) {
  const cache = new Map<FingerprintPlatform, Promise<ServerFingerprint | null>>();
  const warnedMismatches = new Map<string, number>();

  async function computeAsync(platform: FingerprintPlatform): Promise<ServerFingerprint | null> {
    const resolved = importFingerprint(projectRoot);
    if (!resolved) {
      return null;
    }
    const fingerprint = await resolved.Fingerprint.createFingerprintAsync(
      projectRoot,
      nativeFingerprintOptions(platform)
    );
    return {
      hash: fingerprint.hash,
      fingerprintVersion: resolved.version,
      sources: fingerprint.sources,
    };
  }

  return {
    getFingerprintAsync(platform: FingerprintPlatform): Promise<ServerFingerprint | null> {
      let promise = cache.get(platform);
      if (!promise) {
        promise = computeAsync(platform);
        promise.then(
          (server) => {
            // An unresolvable fingerprint package must not be cached: a server without file
            // watching would answer 503 forever, even after the install finishes.
            if (server === null && cache.get(platform) === promise) {
              cache.delete(platform);
            }
          },
          () => {
            // Never cache a failure, and only delete while this entry is still the current one.
            if (cache.get(platform) === promise) {
              cache.delete(platform);
            }
          }
        );
        cache.set(platform, promise);
      }
      return promise;
    },
    onFileChange(): void {
      cache.clear();
    },
    /**
     * Record the fingerprint a client announced, warning at most once per window. Returns the
     * advice on a mismatch, so every stale client gets it in the response, and null on a match.
     */
    recordClientFingerprint(
      platform: FingerprintPlatform,
      announcedHash: string,
      server: ServerFingerprint
    ): MismatchAdvice | null {
      if (announcedHash === server.hash) {
        return null;
      }
      const advice = getMismatchAdvice(projectRoot, platform, server);
      // Keyed on the server hash, never on the announced one: announced hashes come from the
      // client, and keying on them would let anything on the network spam the terminal.
      const key = `${platform}:${server.hash}`;
      const lastWarnedAt = warnedMismatches.get(key);
      const timestamp = now();
      if (lastWarnedAt === undefined || timestamp - lastWarnedAt >= WARN_THROTTLE_MS) {
        // Bounded, for a long session with many project states.
        if (warnedMismatches.size >= 256) {
          warnedMismatches.clear();
        }
        warnedMismatches.set(key, timestamp);
        warn(`${advice.recommendation} Run: ${advice.commands.join(', then ')}`);
      }
      return advice;
    },
  };
}
