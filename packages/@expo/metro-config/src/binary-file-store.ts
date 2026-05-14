import UpstreamFileStore, { type Options } from '@expo/metro/metro-cache/stores/FileStore';
import { Packr } from 'msgpackr';
import fs from 'node:fs';
import path from 'node:path';

import { tryRenameAndDeleteAsync } from './file-store';

const debug = require('debug')('expo:metro:cache') as typeof console.log;

/** Pre-create shard directories all at once as a preflight task */
function ensureShardDirs(root: string): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  for (let i = 0; i < 256; i++) {
    const shard = ('0' + i.toString(16)).slice(-2);
    tasks.push(fs.promises.mkdir(path.join(root, shard), { recursive: true }));
  }
  return Promise.all(tasks).then(() => undefined);
}

class BinaryFileStore<T> extends UpstreamFileStore<T> {
  #root: string;
  #prepare: Promise<void> | undefined;

  #packr = new Packr({
    useRecords: true,
    moreTypes: true,
    // NOTE(@kitten): Experimentally validated to help performance with our cache file format
    bundleStrings: true,
  });

  constructor(options: Options) {
    super(options);
    this.#root = options.root;
  }

  prepare() {
    if (!this.#prepare) {
      this.#prepare = ensureShardDirs(this.#root);
    }
    return this.#prepare;
  }

  async get(key: Buffer): Promise<T | null | undefined> {
    let data: Buffer;
    try {
      data = await fs.promises.readFile(this.#getFilePath(key));
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }
    return this.#packr.decode(data);
  }

  async set(key: Buffer, value: T): Promise<void> {
    // Prevent caching of CSS files that have the skipCache flag set.
    if ((value as any)?.output?.[0]?.data?.css?.skipCache) {
      debug('Skipping caching for CSS file:', (value as any).path);
      return;
    }

    const buffer = this.#packr.encode(value);
    await this.prepare();
    const filePath = this.#getFilePath(key);
    try {
      await fs.promises.writeFile(filePath, buffer);
    } catch (err: any) {
      // The cache root can disappear underneath us if a parallel process clears the cache root
      if (err?.code !== 'ENOENT') throw err;
      this.#prepare = undefined;
      await this.prepare();
      await fs.promises.writeFile(filePath, buffer);
    }
  }

  clear() {
    this.#prepare = undefined;
    if (!tryRenameAndDeleteAsync(this.#root)) {
      super.clear();
    }
  }

  #getFilePath(key: Buffer): string {
    return path.join(
      this.#root,
      key.subarray(0, 1).toString('hex'),
      key.subarray(1).toString('hex') + '.mp'
    );
  }
}

export { BinaryFileStore as FileStore };
