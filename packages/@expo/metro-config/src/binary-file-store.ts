import UpstreamFileStore, { type Options } from '@expo/metro/metro-cache/stores/FileStore';
import { Packr } from 'msgpackr';
import fs from 'node:fs';
import path from 'node:path';

import { tryRenameAndDeleteAsync } from './file-store';

const debug = require('debug')('expo:metro:cache') as typeof console.log;

class BinaryFileStore<T> extends UpstreamFileStore<T> {
  #root: string;

  #packr = new Packr({
    useRecords: true,
    moreTypes: true,
  });

  constructor(options: Options) {
    super(options);
    this.#root = options.root;
  }

  async get(key: Buffer): Promise<T | null | undefined> {
    let data: Buffer;
    try {
      data = await fs.promises.readFile(this.#getFilePath(key));
    } catch (err: any) {
      if (err.code === 'ENOENT' || err instanceof SyntaxError) {
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

    const filePath = this.#getFilePath(key);
    const buffer = this.#packr.encode(value);
    try {
      await fs.promises.writeFile(filePath, buffer);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        await fs.promises.writeFile(filePath, buffer);
      } else {
        throw err;
      }
    }
  }

  clear() {
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
