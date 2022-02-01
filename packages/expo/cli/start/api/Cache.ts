import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { SKIP_CACHE, XDG_CACHE_HOME } from '../../utils/env';
import { CommandError } from '../../utils/errors';

/**
 * A Cache is used to wrap a fallible or expensive function and to memoize its results on disk
 * in case it either fails or we don't need fresh results very often. It stores objects in JSON, and
 * parses JSON from disk when returning an object.
 *
 * It's constructed with a "refresher" callback which will be called for the results, a filename to use
 * for the cache, and an optional TTL and boostrap file. The TTL (in milliseconds) can be used to speed
 * up slow calls from the cache (for example checking npm published versions can be very slow). The
 * bootstrap file can be used to "seed" the cache with a particular value stored in a file.
 *
 * If there is a problem calling the refresher function or in performing the cache's disk I/O, errors
 * will be stored in variables on the class. The only times Cache will throw an exception are if it's
 * not possible to create the cache directory (usually weird home directory permissions), or if getAsync()
 * is called but no value can be provided. The latter will only occur if the refresher fails, no cache
 * is available on disk (i.e. this is the first call or it has been recently cleared), and bootstrapping
 * was not available (either a bootstrap file wasn't provided or reading/writing failed).
 *
 * See src/__tests__/tools/FsCache-test.js for usage examples.
 */
export class Cache<T> {
  refresher: () => T | Promise<T>;
  filename: string;
  bootstrapFile?: string;
  ttlMilliseconds: number;

  readError?: any;
  writeError?: any;

  static getCacheDir(): string {
    const homeDir = os.homedir();
    if (XDG_CACHE_HOME) {
      return XDG_CACHE_HOME;
    } else if (process.platform === 'win32') {
      return path.join(homeDir, 'AppData', 'Local', 'Expo');
    } else if (process.platform === 'darwin') {
      // too many mac users have broken permissions on their ~/.cache directory
      return path.join(homeDir, '.expo', 'cache');
    } else {
      return path.join(homeDir, '.cache', 'expo');
    }
  }

  constructor({
    getAsync,
    filename,
    ttlMilliseconds,
    bootstrapFile,
  }: {
    getAsync: () => T | Promise<T>;
    filename: string;
    ttlMilliseconds?: number;
    bootstrapFile?: string;
  }) {
    this.refresher = getAsync;
    this.filename = path.join(Cache.getCacheDir(), filename);
    this.ttlMilliseconds = ttlMilliseconds || 0;
    this.bootstrapFile = bootstrapFile;
  }

  async getAsync(): Promise<T> {
    // Let user opt out of cache for debugging purposes
    if (SKIP_CACHE) {
      return await this.refresher();
    }

    let mtime: Date;
    try {
      const stats = await fs.stat(this.filename);
      mtime = stats.mtime;
    } catch (e) {
      try {
        await fs.mkdir(Cache.getCacheDir(), { recursive: true });

        if (this.bootstrapFile) {
          const bootstrapContents = (await fs.readFile(this.bootstrapFile)).toString();

          await fs.writeFile(this.filename, bootstrapContents, 'utf8');
        }
      } catch (e) {
        // intentional no-op
      }
      mtime = new Date(1989, 10, 19);
    }

    let fromCache: T | null = null;
    let failedRefresh = null;

    // if mtime + ttl >= now, attempt to fetch the value, otherwise read from disk
    // alternatively, if ttlMilliseconds is 0 we also update every time, regardless of the times.
    // this is a workaround for the issue described in https://github.com/expo/expo-cli/issues/1683
    if (
      this.ttlMilliseconds === 0 ||
      new Date().getTime() - mtime.getTime() > this.ttlMilliseconds
    ) {
      try {
        fromCache = await this.refresher();

        try {
          await fs.writeFile(this.filename, JSON.stringify(fromCache), 'utf8');
        } catch (e) {
          this.writeError = e;
          // do nothing, if the refresh succeeded it'll be returned, if the persist failed we don't care
        }
      } catch (e) {
        failedRefresh = e;
      }
    }

    if (!fromCache) {
      try {
        fromCache = JSON.parse(await fs.readFile(this.filename, 'utf8'));
      } catch (e) {
        this.readError = e;
        // if this fails then we've exhausted our options and it should remain null
      }
    }

    if (fromCache) {
      return fromCache;
    } else {
      if (failedRefresh) {
        throw new CommandError(
          'JSON_CACHE',
          `Unable to perform cache refresh for ${this.filename}: ${failedRefresh}`
        );
      } else {
        throw new CommandError(
          'JSON_CACHE',
          `Unable to read ${this.filename}. ${this.readError || ''}`
        );
      }
    }
  }

  async clearAsync(): Promise<void> {
    try {
      await fs.unlink(this.filename);
    } catch (e) {
      this.writeError = e;
    }
  }
}
