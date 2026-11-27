import type { ExpoConfig } from '@expo/config';
import crypto from 'crypto';

import { env } from '../../../utils/env';
import { manifestDebugEvent } from './events';
import type { RuntimePlatform } from './resolvePlatform';
import { resolveRuntimeVersionWithExpoUpdatesAsync } from './resolveRuntimeVersionWithExpoUpdatesAsync';
import type { FingerprintSourcesWatcher } from './watchFingerprintSourcesAsync';
import { watchFingerprintSourcesAsync } from './watchFingerprintSourcesAsync';

interface CacheEntry {
  configHash: string;
  promise: Promise<string | null>;
  watcher: FingerprintSourcesWatcher | null;
}

/**
 * Caches the runtime version that expo-updates resolves for each platform, so manifest requests
 * don't recompute the project fingerprint every time.
 *
 * - Concurrent requests for the same platform and app config share one resolution.
 * - A `fingerprint` runtime version is kept until the app config changes or one of the
 *   fingerprint's sources changes on disk. Other runtime version policies are resolved again on
 *   every request.
 * - Failed resolutions aren't kept.
 * - When the fingerprint sources can't be watched, caching is disabled for the rest of the session.
 *   `EXPO_NO_RUNTIME_VERSION_CACHE=1` disables it from the start.
 */
export class RuntimeVersionCache {
  private entries = new Map<RuntimePlatform, CacheEntry>();
  private isDisabled = false;

  constructor(
    private projectRoot: string,
    private watchSourcesAsync: typeof watchFingerprintSourcesAsync = watchFingerprintSourcesAsync
  ) {}

  getRuntimeVersionAsync(platform: RuntimePlatform, exp: ExpoConfig): Promise<string | null> {
    if (env.EXPO_NO_RUNTIME_VERSION_CACHE || this.isDisabled) {
      return this.resolveAsync(platform);
    }

    const configHash = crypto.createHash('sha1').update(JSON.stringify(exp)).digest('hex');
    const existing = this.entries.get(platform);
    if (existing?.configHash === configHash) {
      return existing.promise;
    }
    if (existing) {
      this.evict(platform, existing);
    }

    const entry: CacheEntry = { configHash, promise: Promise.resolve(null), watcher: null };
    this.entries.set(platform, entry);
    entry.promise = this.resolveAndWatchAsync(platform, entry);
    return entry.promise;
  }

  private async resolveAsync(platform: RuntimePlatform): Promise<string | null> {
    const result = await resolveRuntimeVersionWithExpoUpdatesAsync({
      projectRoot: this.projectRoot,
      platform,
    });
    return result?.runtimeVersion ?? null;
  }

  private async resolveAndWatchAsync(
    platform: RuntimePlatform,
    entry: CacheEntry
  ): Promise<string | null> {
    const changedSinceMs = Date.now();
    let result: Awaited<ReturnType<typeof resolveRuntimeVersionWithExpoUpdatesAsync>>;
    try {
      result = await resolveRuntimeVersionWithExpoUpdatesAsync({
        projectRoot: this.projectRoot,
        platform,
      });
    } catch (error) {
      this.evict(platform, entry);
      throw error;
    }

    const runtimeVersion = result?.runtimeVersion ?? null;
    // Only fingerprint runtime versions are kept. Other policies are cheaper to resolve, and they
    // also depend on the detected workflow, which no watcher covers here.
    if (!result?.fingerprintSources || this.entries.get(platform) !== entry) {
      this.evict(platform, entry);
      return runtimeVersion;
    }

    try {
      const watcher = await this.watchSourcesAsync(this.projectRoot, {
        platform,
        sources: result.fingerprintSources,
        workflow: result.workflow,
        changedSinceMs,
        onChange: () => this.evict(platform, entry),
        onError: (error) => this.disable(error),
      });
      if (watcher && this.entries.get(platform) === entry) {
        entry.watcher = watcher;
      } else {
        // The sources changed while resolving, or the entry was replaced in the meantime.
        watcher?.close();
        this.evict(platform, entry);
      }
    } catch (error: any) {
      this.disable(error);
    }
    return runtimeVersion;
  }

  private evict(platform: RuntimePlatform, entry: CacheEntry) {
    entry.watcher?.close();
    entry.watcher = null;
    if (this.entries.get(platform) === entry) {
      this.entries.delete(platform);
    }
  }

  /** Stop caching for the rest of the session, and resolve the runtime version on every request. */
  private disable(error: Error) {
    if (this.isDisabled) {
      return;
    }
    this.isDisabled = true;
    manifestDebugEvent('runtime_version_cache_disabled', {
      error: manifestDebugEvent.error(error),
    });
    for (const [platform, entry] of this.entries) {
      this.evict(platform, entry);
    }
  }
}
