import spawnAsync from '@expo/spawn-async';
import { randomBytes } from 'crypto';
import { realpathSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

function temporaryDirectory() {
  const tempDir = realpathSync(tmpdir());
  const uniqueString = randomBytes(16).toString('hex');
  const directory = join(tempDir, uniqueString);
  mkdirSync(directory);
  return directory;
}

jest.setTimeout(1000 * 60 * 5);

describe('findSharpInstanceAsync', () => {
  beforeEach(async () => {
    await spawnAsync('yarn', ['config', 'set', 'global-folder', temporaryDirectory()]);
  });

  afterEach(async () => {
    await spawnAsync('yarn', ['config', 'delete', 'global-folder']);
  });

  it(`resolves global sharp-cli path with yarn`, async () => {
    await spawnAsync('yarn', ['global', 'add', 'sharp-cli@^2.1.0']);
    const { findSharpInstanceAsync } = require('../../src');
    await expect(findSharpInstanceAsync()).resolves.not.toThrow();
  });
});
