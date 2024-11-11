import glob from 'fast-glob';
import { vol } from 'memfs';

import { isFileIgnoredAsync } from '../../utils/files';
import { ProjectSetupCheck } from '../ProjectSetupCheck';

jest.mock('fs');
jest.mock('fast-glob');
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
  // ignoring native files for local modules check
  it('returns result with isSuccessful = true if no local expo modules are present', async () => {
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if local module with ios folder and ios folder is not gitignored', async () => {
    const iosPath = `${projectRoot}/modules/HelloModule/ios/HelloModule.podspec`;
    vol.fromJSON({
      [iosPath]: 'test',
    });

    const mockGlob = glob as jest.MockedFunction<typeof glob>;
    mockGlob.mockImplementation((pattern: string | string[], options: glob.Options = {}) => {
      if (
        typeof pattern === 'string' &&
        pattern === 'modules/**/ios/*.podspec' &&
        options.cwd === projectRoot
      ) {
        return Promise.resolve([iosPath]);
      }
      return Promise.resolve([]);
    });

    mockIsFileIgnoredResult(false);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(glob).toHaveBeenCalledWith(
      `modules/**/ios/*.podspec`,
      expect.objectContaining({ cwd: projectRoot, absolute: true })
    );
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(iosPath, expect.anything());
  });

  it('returns result with isSuccessful = true if local module with android folder and android folder is not gitignored', async () => {
    const androidPath = `${projectRoot}/modules/HelloModule/android/build.gradle`;
    vol.fromJSON({
      [androidPath]: 'test',
    });

    const mockGlob = glob as jest.MockedFunction<typeof glob>;
    mockGlob.mockImplementation((pattern: string | string[], options: glob.Options = {}) => {
      if (
        typeof pattern === 'string' &&
        pattern === 'modules/**/android/build.gradle' &&
        options.cwd === projectRoot
      ) {
        return Promise.resolve([androidPath]);
      }
      return Promise.resolve([]);
    });

    (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(false);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(mockGlob).toHaveBeenCalledWith(
      'modules/**/android/build.gradle',
      expect.objectContaining({ cwd: projectRoot, absolute: true })
    );
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(androidPath, expect.anything());
  });

  it('returns result with isSuccessful = false if local module with ios folder and ios folder is gitignored', async () => {
    const iosPath = `${projectRoot}/modules/HelloModule/ios/HelloModule.podspec`;
    vol.fromJSON({
      [iosPath]: 'test',
    });

    const mockGlob = glob as jest.MockedFunction<typeof glob>;
    mockGlob.mockImplementation((pattern: string | string[], options: glob.Options = {}) => {
      if (
        typeof pattern === 'string' &&
        pattern === 'modules/**/ios/*.podspec' &&
        options.cwd === projectRoot
      ) {
        return Promise.resolve([iosPath]);
      }
      return Promise.resolve([]);
    });

    (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(true);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(mockGlob).toHaveBeenCalledWith(
      'modules/**/ios/*.podspec',
      expect.objectContaining({ cwd: projectRoot, absolute: true })
    );
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(iosPath, expect.anything());
  });

  it('returns result with isSuccessful = false if local module with android folder and android folder is gitignored', async () => {
    const androidPath = `${projectRoot}/modules/HelloModule/android/build.gradle`;
    vol.fromJSON({
      [androidPath]: 'test',
    });

    const mockGlob = glob as jest.MockedFunction<typeof glob>;
    mockGlob.mockImplementation((pattern: string | string[], options: glob.Options = {}) => {
      if (
        typeof pattern === 'string' &&
        pattern === 'modules/**/android/build.gradle' &&
        options.cwd === projectRoot
      ) {
        return Promise.resolve([androidPath]);
      }
      return Promise.resolve([]);
    });

    (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(true);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(mockGlob).toHaveBeenCalledWith(
      'modules/**/android/build.gradle',
      expect.objectContaining({ cwd: projectRoot, absolute: true })
    );
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(androidPath, expect.anything());
  });

  // multiple lock files
  it('returns result with isSuccessful = true if just one lock file', async () => {
    vol.fromJSON({
      [projectRoot + '/yarn.lock']: 'test',
    });
    const check = new ProjectSetupCheck();
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
    const check = new ProjectSetupCheck();
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
    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeFalsy();
  });
});
