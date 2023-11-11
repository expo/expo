import FileStore from 'metro-cache/src/stores/FileStore';

const debug = require('debug')('expo:metro:cache') as typeof console.log;

export class ExpoMetroFileStore<T> extends FileStore<T> {
  async set(key: Buffer, value: any): Promise<void> {
    const src = value?.output?.[0]?.data?.code;
    // console.log('CACHE:', value?.output?.[0]?.data?.css);
    if (value?.output?.[0]?.data?.css?.skipCache) {
      debug('Skipping caching for CSS file:', value.path);
      return;
    }
    if (src) {
      // Match `// @metro no-cache` or `/** @metro no-cache`
      if (src.match(/^(?:[\s\t]+)(?:\/\/|\/[*]+)(?:[\s\t]+)?@metro\s(?:[\s\t]+)?no-cache/m)) {
        debug('Skipping caching');
        return;
      }
    }
    return await super.set(key, value);
  }
}
