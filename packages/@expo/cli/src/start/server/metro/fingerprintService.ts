import type { FingerprintSource } from '@expo/fingerprint';
import fs from 'fs';
import path from 'path';

import {
  formatPrebuildChanges,
  getPrebuildStaleness,
  importFingerprint,
  nativeFingerprintOptions,
  readPrebuildFingerprintMarker,
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

/**
 * Explain a mismatch the way `npx expo needs-rebuild` does. When the app config or a config
 * plugin changed after the native directories were generated, a plain rebuild compiles the
 * stale directories and embeds the new hash — hiding the problem instead of fixing it, so the
 * advice has to name `prebuild` first.
 */
function getMismatchAdvice(
  projectRoot: string,
  platform: FingerprintPlatform,
  server: ServerFingerprint
): MismatchAdvice {
  const prefix = `The installed ${platform} app does not match the project`;
  // Without a native directory there is nothing to regenerate. A bare project has one but no
  // marker, which reads as `unknown` and falls through to the plain rebuild advice.
  if (fs.existsSync(path.join(projectRoot, platform))) {
    const { status, changes } = getPrebuildStaleness({
      marker: readPrebuildFingerprintMarker(projectRoot, platform),
      currentSources: server.sources,
      currentFingerprintVersion: server.fingerprintVersion,
    });
    if (status === 'stale') {
      return {
        recommendation: `${prefix} — ${formatPrebuildChanges(changes)} changed after the ${platform} directory was generated.`,
        commands: [`npx expo prebuild -p ${platform}`, `npx expo run:${platform}`],
      };
    }
  }
  return {
    recommendation: `${prefix} — native inputs changed since it was built.`,
    commands: [`npx expo run:${platform}`],
  };
}

/**
 * Computes and caches the project fingerprint for the dev server. A cache is required: apps
 * announce their embedded fingerprint on every reload, and an uncached computation costs
 * 1–2.5 s of CPU during each rebundle. The cache stores the in-flight promise, so concurrent
 * requests share one computation, and `onFileChange` (any watched file) simply clears it —
 * a computation that resolves after a clear never repopulates the cache.
 */

export function createFingerprintService(
  projectRoot: string,
  { warn }: { warn: (message: string) => void }
) {
  const cache = new Map<FingerprintPlatform, Promise<ServerFingerprint | null>>();
  const warnedMismatches = new Set<string>();

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
        promise.catch(() => {
          // Never cache failures. Only delete when still current — a clear plus a fresh
          // computation may have replaced this entry while it was rejecting.
          if (cache.get(platform) === promise) {
            cache.delete(platform);
          }
        });
        cache.set(platform, promise);
      }
      return promise;
    },
    onFileChange(): void {
      cache.clear();
    },
    /**
     * Record the embedded fingerprint a client announced; warn once per distinct mismatch.
     * Returns the remediation advice on a mismatch — every stale client gets it in the HTTP
     * response, not just the one that triggered the warning — and `null` on a match.
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
      // Key by (platform, server hash), not the announced hash: the warning text is identical
      // for every mismatch against the same project state, and announced hashes are
      // attacker-controlled input — keying on them would allow unbounded terminal spam.
      const key = `${platform}:${server.hash}`;
      if (!warnedMismatches.has(key)) {
        // Bound the memory across long sessions with many project states.
        if (warnedMismatches.size >= 256) {
          warnedMismatches.clear();
        }
        warnedMismatches.add(key);
        warn(`${advice.recommendation} Run: ${advice.commands.join(', then ')}`);
      }
      return advice;
    },
  };
}
