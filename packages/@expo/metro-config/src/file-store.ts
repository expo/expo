import UpstreamFileStore from '@bycedric/metro/metro-cache/src/stores/FileStore';

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
