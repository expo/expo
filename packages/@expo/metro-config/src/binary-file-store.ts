import UpstreamFileStore, { type Options } from '@expo/metro/metro-cache/stores/FileStore';
import fs from 'node:fs';
import path from 'node:path';

import { decode, encode } from './binary-file-store/serializer';
import { event } from './events';
import { tryRenameAndDeleteAsync } from './file-store';

const { pid } = process;

/** Pre-create shard directories all at once as a preflight task */
function ensureShardDirs(root: string): Promise<void> {
  const tasks: Promise<unknown>[] = [];
  for (let i = 0; i < 256; i++) {
    const shard = ('0' + i.toString(16)).slice(-2);
    tasks.push(fs.promises.mkdir(path.join(root, shard), { recursive: true }));
  }
  return Promise.all(tasks).then(() => undefined);
}

async function renameWithRetry(from: string, to: string): Promise<void> {
  try {
    await fs.promises.rename(from, to);
  } catch (err: any) {
    if (err?.code !== 'EPERM' && err?.code !== 'EBUSY') throw err;
    await new Promise((resolve) => setTimeout(resolve, 50));
    await fs.promises.rename(from, to);
  }
}

const getTmpName = (name: string): string => `.tmp${pid}_${name}`;

class BinaryFileStore<T> extends UpstreamFileStore<T> {
  #root: string;
  #prepare: Promise<void> | undefined;

  constructor(options: Options) {
    super(options);
    this.#root = path.resolve(options.root);
  }

  prepare() {
    if (!this.#prepare) {
      this.#prepare = ensureShardDirs(this.#root);
    }
    return this.#prepare;
  }

  async get(key: Buffer): Promise<T | null | undefined> {
    const filePath = this.#getFileDir(key) + path.sep + this.#getFileName(key);
    let data: Buffer;
    try {
      data = await fs.promises.readFile(filePath);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return null;
      }
      throw err;
    }

    try {
      return decode(data) as T;
    } catch (err) {
      fs.promises.unlink(filePath).catch(() => {});
      return null;
    }
  }

  async set(key: Buffer, value: T): Promise<void> {
    // Prevent caching of CSS files that have the skipCache flag set.
    if ((value as any)?.output?.[0]?.data?.css?.skipCache) {
      event('cache:skipped_css', { path: (value as any).path });
      return;
    }

    const buffer = encode(value);
    await this.prepare();
    const fileDir = this.#getFileDir(key);
    const fileName = this.#getFileName(key);
    const targetTemp = fileDir + path.sep + getTmpName(fileName);
    const targetPath = fileDir + path.sep + fileName;
    let renamed = false;
    try {
      await fs.promises.writeFile(targetTemp, buffer);
      await renameWithRetry(targetTemp, targetPath);
      renamed = true;
    } catch (err: any) {
      // The cache root can disappear underneath us if a parallel process clears the cache root
      if (err?.code !== 'ENOENT') throw err;
      this.#prepare = undefined;
      await this.prepare();
      await fs.promises.writeFile(targetTemp, buffer);
      await renameWithRetry(targetTemp, targetPath);
      renamed = true;
    } finally {
      if (!renamed) await fs.promises.unlink(targetTemp).catch(() => {});
    }
  }

  clear() {
    this.#prepare = undefined;
    if (!tryRenameAndDeleteAsync(this.#root)) {
      super.clear();
    }
  }

  #getFileDir(key: Buffer): string {
    return this.#root + path.sep + key.subarray(0, 1).toString('hex');
  }

  #getFileName(key: Buffer): string {
    return key.subarray(1).toString('hex') + '.mp';
  }
}

export { BinaryFileStore as FileStore };
