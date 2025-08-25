import { glob, GlobOptions } from 'glob';
import { vol } from 'memfs';
import { resolveWorkspaceRoot } from 'resolve-workspace-root';

import { isFileIgnoredAsync } from '../../utils/files';
import { LockfileCheck } from '../LockfileCheck';

jest.mock('fs');
jest.mock('glob');
jest.mock('../../utils/files');
jest.mock('resolve-workspace-root', () => ({
  resolveWorkspaceRoot: jest.fn(() => null),
}));

const projectRoot = '/tmp/project';
const monorepoRoot = '/monorepo-root';
const appDir = '/monorepo-root/app';

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

  // monorepo
  it('uses monorepo root lockfile when running from a workspace app', async () => {
    vol.fromJSON({
      [monorepoRoot + '/yarn.lock']: 'test',
    });

    jest.mocked(resolveWorkspaceRoot).mockReturnValue(monorepoRoot);

    const check = new LockfileCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: { name: 'name', slug: 'slug' },
      projectRoot: appDir,
      hasUnusedStaticConfig: false,
      staticConfigPath: null,
      dynamicConfigPath: null,
    });

    expect(result.isSuccessful).toBeTruthy();
  });

  it('reports multiple lockfiles found at the monorepo root', async () => {
    vol.fromJSON({
      [monorepoRoot + '/yarn.lock']: 'test',
      [monorepoRoot + '/package-lock.json']: 'test',
    });

    jest.mocked(resolveWorkspaceRoot).mockReturnValue(monorepoRoot);

    const check = new LockfileCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      exp: { name: 'name', slug: 'slug' },
      projectRoot: appDir,
      hasUnusedStaticConfig: false,
      staticConfigPath: null,
      dynamicConfigPath: null,
    });

    expect(result.isSuccessful).toBeFalsy();
  });
});
