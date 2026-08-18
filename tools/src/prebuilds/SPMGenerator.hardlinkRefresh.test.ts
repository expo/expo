import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import { refreshHardlinkIfNeeded } from './SPMGenerator';

describe('refreshHardlinkIfNeeded', () => {
  it('relinks when the source inode changed even though content is identical', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-hardlink-'));
    try {
      const src = path.join(tmp, 'src.h');
      const dest = path.join(tmp, 'staging', 'dest.h');
      const content = '#pragma once\nint X = 1;\n';
      await fs.outputFile(src, content);

      assert.equal(await refreshHardlinkIfNeeded(src, dest), true);
      const inodeBefore = (await fs.stat(dest)).ino;
      assert.equal(inodeBefore, (await fs.stat(src)).ino);

      // Simulate pnpm reinstall: same bytes, fresh inode.
      await fs.remove(src);
      await fs.outputFile(src, content);
      const newSrcInode = (await fs.stat(src)).ino;
      assert.notEqual(newSrcInode, inodeBefore);
      assert.equal((await fs.stat(dest)).ino, inodeBefore);

      assert.equal(await refreshHardlinkIfNeeded(src, dest), true);
      assert.equal((await fs.stat(dest)).ino, newSrcInode);
    } finally {
      await fs.remove(tmp);
    }
  });

  it('is a no-op when source and dest already share an inode', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'spm-hardlink-'));
    try {
      const src = path.join(tmp, 'src.h');
      const dest = path.join(tmp, 'staging', 'dest.h');
      await fs.outputFile(src, 'x');

      assert.equal(await refreshHardlinkIfNeeded(src, dest), true);
      const ctimeAfterFirst = (await fs.stat(dest)).ctimeMs;

      assert.equal(await refreshHardlinkIfNeeded(src, dest), false);
      assert.equal((await fs.stat(dest)).ctimeMs, ctimeAfterFirst);
    } finally {
      await fs.remove(tmp);
    }
  });
});
