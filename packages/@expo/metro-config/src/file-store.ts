import UpstreamFileStore from 'metro-cache/src/stores/FileStore';
import { env } from './env';

const debug = require('debug')('expo:metro:cache') as typeof console.log;

export class FileStore<T> extends UpstreamFileStore<T> {
  async set(key: Buffer, value: any): Promise<void> {
    // Prevent caching of CSS files that have the skipCache flag set.
    if (value?.output?.[0]?.data?.css?.skipCache) {
      debug('Skipping caching for CSS file:', value.path);
      return;
    }
    return await super.set(key, value);
  }
}

export class VendorFileStore<T> extends UpstreamFileStore<T> {
  clear() {
    if (!env.__EXPO_SEED_CACHE) {
      return;
    }
    console.warn('CLEARING VENDOR CACHE');
    return super.clear();
  }
  async set(key: Buffer, value: any): Promise<void> {
    if (!env.__EXPO_SEED_CACHE) {
      return;
    }
    return await super.set(key, value);
  }
}
