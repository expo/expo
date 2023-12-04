import spawnAsync from '@expo/spawn-async';
import temporary from 'tempy';

jest.setTimeout(1000 * 60 * 5);

describe('findSharpInstanceAsync', () => {
  beforeEach(async () => {
    await spawnAsync('yarn', ['config', 'set', 'global-folder', temporary.directory()]);
  });

  afterEach(async () => {
    await spawnAsync('yarn', ['config', 'delete', 'global-folder']);
  });

  it(`resolves global sharp-cli path with yarn`, async () => {
    await spawnAsync('yarn', ['global', 'add', 'sharp-cli@1.15.0']);
    const { findSharpInstanceAsync } = require('../../src');
    await expect(findSharpInstanceAsync()).resolves.not.toThrow();
  });
});
