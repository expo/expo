import { glob, GlobOptions } from 'glob';
import { vol } from 'memfs';

import { isFileIgnoredAsync } from '../../utils/files';
import { LockfileCheck } from '../LockfileCheck';

jest.mock('fs');
jest.mock('glob');
jest.mock('../../utils/files');

const projectRoot = '/tmp/project';

// required by runAsync
const additionalProjectProps = {
  exp: {
    name: 'name',
    slug: 'slug',
  },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

/**
 * Helper to mock the results of isFileIgnoredAsync for all matching files.
 */
function mockIsFileIgnoredResult(isFileIgnored: boolean) {
  (isFileIgnoredAsync as jest.Mock).mockResolvedValue(isFileIgnored);
}

describe('runAsync', () => {
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('returns result with isSuccessful = false if no lockfile', async () => {
    vol.fromJSON({});
    const check = new LockfileCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  // multiple lock files
  it('returns result with isSuccessful = true if just one lock file', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
    });
    const check = new LockfileCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false if more than one lockfile (yarn + npm)', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
      [projectRoot + '/package-lock.json']: 'test',
    });
    const check = new LockfileCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = false if more than one lockfile (yarn + pnpm)', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
      [projectRoot + '/pnpm-lock.yaml']: 'test',
    });
    const check = new LockfileCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
