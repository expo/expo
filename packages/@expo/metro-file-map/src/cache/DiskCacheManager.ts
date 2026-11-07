/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import debugModule from 'debug';
import { promises as fsPromises } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { clearTimeout, setTimeout } from 'timers';
import { deserialize, serialize } from 'v8';

import rootRelativeCacheKeys from '../lib/rootRelativeCacheKeys';
import type {
  BuildParameters,
  CacheData,
  CacheManager,
  CacheManagerFactoryOptions,
  CacheManagerWriteOptions,
} from '../types';

const debug = debugModule('Metro:FileMapCache');

declare global {
  namespace NodeJS {
    export interface Process {
      isBun?: boolean;
    }
  }
}

type AutoSaveOptions = Readonly<{
  debounceMs: number;
}>;

type DiskCacheConfig = Readonly<{
  autoSave?: Partial<AutoSaveOptions> | boolean;
  cacheFilePrefix?: string | null | undefined;
  cacheDirectory?: string | null | undefined;
}>;

let DEFAULT_PREFIX = 'metro-file-map';
if (process.isBun) {
  // NOTE(@kitten): The v8 serialize/deserialize format isn't 100% compatible between
  // Node and Bun and therefore we should fork the cache file
  DEFAULT_PREFIX += '-bun';
}

const DEFAULT_DIRECTORY = tmpdir();
const DEFAULT_AUTO_SAVE_DEBOUNCE_MS = 5000;

// NOTE(@kitten): We're incompatible with Metro, so need our own naming
const FIXED_PREFIX = 'expo';

export class DiskCacheManager implements CacheManager {
  readonly #autoSaveOpts: AutoSaveOptions | null | undefined;
  readonly #cachePath: string;
  #debounceTimeout: ReturnType<typeof setTimeout> | null = null;
  #writePromise: Promise<void> = Promise.resolve();
  #hasUnwrittenChanges: boolean = false;
  #tryWrite: (() => Promise<void>) | null | undefined;
  #stopListening: (() => void) | null | undefined;

  constructor(opts: CacheManagerFactoryOptions, config: DiskCacheConfig) {
    const { buildParameters } = opts;
    const { autoSave = {}, cacheDirectory, cacheFilePrefix } = config;
    this.#cachePath = DiskCacheManager.getCacheFilePath(
      buildParameters,
      cacheFilePrefix,
      cacheDirectory
    );

    // Normalise auto-save options.
    if (autoSave) {
      const { debounceMs = DEFAULT_AUTO_SAVE_DEBOUNCE_MS } = autoSave === true ? {} : autoSave;
      this.#autoSaveOpts = { debounceMs };
    }
  }

  static getCacheFilePath(
    buildParameters: BuildParameters,
    cacheFilePrefix?: string | null,
    cacheDirectory?: string | null
  ): string {
    const { rootDirHash, relativeConfigHash } = rootRelativeCacheKeys(buildParameters);

    return path.join(
      cacheDirectory ?? DEFAULT_DIRECTORY,
      `${cacheFilePrefix ?? DEFAULT_PREFIX}-${FIXED_PREFIX}-${rootDirHash}-${relativeConfigHash}`
    );
  }

  getCacheFilePath(): string {
    return this.#cachePath;
  }

  async read(): Promise<CacheData | null | undefined> {
    try {
      return deserialize(await fsPromises.readFile(this.#cachePath));
    } catch (e) {
      if ((e as NodeJS.ErrnoException | null)?.code === 'ENOENT') {
        // Cache file not found - not considered an error.
        return null;
      }
      // Rethrow anything else.
      throw e;
    }
  }

  async write(getSnapshot: () => CacheData, opts: CacheManagerWriteOptions): Promise<void> {
    const { changedSinceCacheRead, eventSource, onWriteError } = opts;
    // Initialise a writer function using a promise queue to ensure writes are
    // sequenced.
    // eslint-disable-next-line no-multi-assign
    const tryWrite = (this.#tryWrite = () => {
      this.#writePromise = this.#writePromise
        .then(async () => {
          if (!this.#hasUnwrittenChanges) {
            return;
          }
          const data = getSnapshot();
          this.#hasUnwrittenChanges = false;
          const serialized = serialize(data);
          try {
            await fsPromises.writeFile(this.#cachePath, serialized);
          } catch (e) {
            if ((e as NodeJS.ErrnoException | null)?.code !== 'ENOENT') {
              throw e;
            }
            // The cache directory doesn't exist yet - create it and retry.
            await fsPromises.mkdir(path.dirname(this.#cachePath), {
              recursive: true,
            });
            await fsPromises.writeFile(this.#cachePath, serialized);
          }
          debug('Written cache to %s', this.#cachePath);
        })
        .catch(onWriteError);
      return this.#writePromise;
    });

    // Set up auto-save on changes, if enabled.
    if (this.#autoSaveOpts) {
      const autoSave = this.#autoSaveOpts;
      this.#stopListening?.();
      this.#stopListening = eventSource.onChange(() => {
        this.#hasUnwrittenChanges = true;
        if (this.#debounceTimeout) {
          this.#debounceTimeout.refresh();
        } else {
          this.#debounceTimeout = setTimeout(() => tryWrite(), autoSave.debounceMs).unref();
        }
      });
    }

    // Write immediately if state has changed since the cache was read.
    if (changedSinceCacheRead) {
      this.#hasUnwrittenChanges = true;
      await tryWrite();
    }
  }

  async end(): Promise<void> {
    // Clear any timers
    if (this.#debounceTimeout) {
      clearTimeout(this.#debounceTimeout);
    }

    // Remove event listeners
    this.#stopListening?.();

    // Flush unwritten changes to disk (no-op if no changes)
    await this.#tryWrite?.();
  }
}
