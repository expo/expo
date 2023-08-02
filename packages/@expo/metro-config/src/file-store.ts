import FileStore from 'metro-cache/src/stores/FileStore';

const debug = require('debug')('expo:metro:cache') as typeof console.log;

export class ExpoMetroFileStore<T> {
  private fileStore: FileStore<T>;

  constructor(options: any) {
    this.fileStore = new FileStore<T>(options);
  }

  async get(key: Buffer): Promise<T | null> {
    const result = await this.fileStore.get(key);
    return result;
  }

  async set(key: Buffer, value: any): Promise<void> {
    const src = value?.output?.[0]?.data?.code;
    if (src) {
      if (src.match(/^(?:[\s\t]+)\/\/(?:\s+)?@metro no-cache/m)) {
        debug('Skipping caching');
        return;
      }
    }
    return await this.fileStore.set(key, value);
  }

  clear(): void {
    this.fileStore.clear();
  }
}
