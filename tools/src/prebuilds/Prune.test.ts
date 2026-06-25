import fs from 'fs-extra';
import assert from 'node:assert/strict';
import os from 'node:os';
import { describe, it } from 'node:test';
import path from 'path';

import { findDerivedDataDirsAsync } from './Prune';

describe('findDerivedDataDirsAsync', () => {
  it('targets frameworks/ (DerivedData) and never the xcframeworks/ deliverables', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prebuild-prune-'));
    try {
      // Non-versioned (Expo package) layout
      await fs.ensureDir(path.join(tmp, 'output', 'debug', 'frameworks', 'ExpoFoo', 'Build'));
      await fs.outputFile(
        path.join(tmp, 'output', 'debug', 'xcframeworks', 'ExpoFoo.xcframework', 'x'),
        '1'
      );
      await fs.outputFile(
        path.join(tmp, 'output', 'debug', 'xcframeworks', 'ExpoFoo.tar.gz'),
        'tar'
      );
      await fs.ensureDir(path.join(tmp, 'output', 'release', 'frameworks', 'ExpoFoo'));

      // Versioned (external package) layout — xcframeworks live under a version prefix
      await fs.ensureDir(path.join(tmp, 'output', 'release', 'frameworks', 'RNFoo'));
      await fs.outputFile(
        path.join(
          tmp,
          'output',
          '1.2.3',
          '0.83.0',
          '1.0.0',
          'release',
          'xcframeworks',
          'RNFoo.xcframework',
          'x'
        ),
        '1'
      );

      // A directory literally named `frameworks` that is NOT under output/<flavor>/ must
      // not be mistaken for DerivedData (e.g. nested inside the build products).
      await fs.ensureDir(path.join(tmp, 'output', 'debug', 'frameworks', 'nested', 'frameworks'));

      const dirs = (await findDerivedDataDirsAsync(tmp)).sort();

      assert.deepEqual(dirs, [
        path.join(tmp, 'output', 'debug', 'frameworks'),
        path.join(tmp, 'output', 'release', 'frameworks'),
      ]);
      // The substring "frameworks" inside "xcframeworks" must not cause a match.
      assert.ok(
        !dirs.some((d) => d.includes('xcframeworks')),
        'must not select any xcframeworks directory'
      );
    } finally {
      await fs.remove(tmp);
    }
  });

  it('returns nothing when there is no output directory', async () => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'prebuild-prune-'));
    try {
      assert.deepEqual(await findDerivedDataDirsAsync(tmp), []);
    } finally {
      await fs.remove(tmp);
    }
  });
});
