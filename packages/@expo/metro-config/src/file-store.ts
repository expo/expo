import UpstreamFileStore from '@expo/metro/metro-cache/stores/FileStore';
import fs from 'fs';
import os from 'os';
import path from 'path';

const debug = require('debug')('expo:metro:cache') as typeof console.log;

// On macOS `os.tmpdir()` returns `/var/folders/...` while its realpath is
// `/private/var/folders/...`; accept either form so callers that resolved
// symlinks aren't excluded.
function isInsideOsTmpdir(target: string): boolean {
  const resolved = path.resolve(target);
  const tmp = path.resolve(os.tmpdir());
  if (resolved !== tmp && resolved.startsWith(tmp + path.sep)) {
    return true;
  }
  let tmpReal: string;
  try {
    tmpReal = fs.realpathSync(tmp);
  } catch {
    return false;
  }
  return resolved !== tmpReal && resolved.startsWith(tmpReal + path.sep);
}

// Renames `root` to a sibling tombstone and deletes it in the background.
// Returns false if the caller should fall back to a synchronous remove.
// `maxRetries` covers the Windows case where files just closed can briefly
// fail to delete with EBUSY/EPERM.
function tryRenameAndDeleteAsync(root: string): boolean {
  if (!isInsideOsTmpdir(root)) {
    return false;
  }
  const tombstone = `${root}.delete-${process.pid}-${Date.now()}`;
  try {
    fs.renameSync(root, tombstone);
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      return true;
    }
    debug('Cache rename failed, falling back to recursive remove:', err);
    return false;
  }
  fs.promises.rm(tombstone, { recursive: true, force: true, maxRetries: 3 }).catch((err) => {
    debug('Failed to remove cache tombstone:', tombstone, err);
  });
  return true;
}

export class FileStore<T> extends UpstreamFileStore<T> {
  private readonly _root: string;

  constructor(options: { root: string }) {
    super(options);
    this._root = options.root;
  }

  async set(key: Buffer, value: any): Promise<void> {
    // Prevent caching of CSS files that have the skipCache flag set.
    if (value?.output?.[0]?.data?.css?.skipCache) {
      debug('Skipping caching for CSS file:', value.path);
      return;
    }
    return await super.set(key, value);
  }

  clear(): void {
    if (!tryRenameAndDeleteAsync(this._root)) {
      super.clear();
    }
  }
}
