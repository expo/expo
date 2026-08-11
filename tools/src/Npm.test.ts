import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { packToTarballAsync } from './Npm';

describe('packToTarballAsync', () => {
  let packageDir: string;

  beforeEach(async () => {
    packageDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'expotools-pack-test-'));
    await fs.promises.writeFile(
      path.join(packageDir, 'package.json'),
      JSON.stringify({ name: 'pack-fixture', version: '2.0.0' })
    );
    await fs.promises.writeFile(path.join(packageDir, 'index.js'), '');
  });

  afterEach(async () => {
    await fs.promises.rm(packageDir, { recursive: true, force: true });
  });

  it('returns the tarball it has just created', async () => {
    const result = await packToTarballAsync(packageDir);

    assert.equal(result.name, 'pack-fixture');
    assert.equal(result.version, '2.0.0');
    assert.equal(path.basename(result.filePath), 'pack-fixture-2.0.0.tgz');
    assert.ok(fs.existsSync(result.filePath));
  });

  it('ignores tarballs left in the package directory by earlier packs', async () => {
    await fs.promises.writeFile(path.join(packageDir, 'pack-fixture-1.0.0.tgz'), '');

    const result = await packToTarballAsync(packageDir);

    assert.equal(path.basename(result.filePath), 'pack-fixture-2.0.0.tgz');
    assert.ok(fs.statSync(result.filePath).size > 0);
  });

  it('does not write the tarball into the package directory', async () => {
    await packToTarballAsync(packageDir);

    const entries = await fs.promises.readdir(packageDir);
    assert.deepEqual(
      entries.filter((entry) => entry.endsWith('.tgz')),
      []
    );
  });
});
