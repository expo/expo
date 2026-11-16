import { vol } from 'memfs';

import { isFileIgnoredAsync } from '../../utils/files';
import { findModuleFilesAsync } from '../../utils/findModuleFiles';
import { ProjectSetupCheck } from '../ProjectSetupCheck';

jest.mock('fs');
jest.mock('../../utils/findModuleFiles');
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

    jest.mocked(findModuleFilesAsync).mockResolvedValue([iosPath]);

    mockIsFileIgnoredResult(false);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(findModuleFilesAsync).toHaveBeenCalledWith(projectRoot);
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(iosPath, expect.anything());
  });

  it('returns result with isSuccessful = true if local module with android folder and android folder is not gitignored', async () => {
    const androidPath = `${projectRoot}/modules/HelloModule/android/build.gradle`;
    vol.fromJSON({
      [androidPath]: 'test',
    });

    jest.mocked(findModuleFilesAsync).mockResolvedValue([androidPath]);

    (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(false);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeTruthy();
    expect(findModuleFilesAsync).toHaveBeenCalledWith(projectRoot);
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(androidPath, expect.anything());
  });

  it('returns result with isSuccessful = false if local module with ios folder and ios folder is gitignored', async () => {
    const iosPath = `${projectRoot}/modules/HelloModule/ios/HelloModule.podspec`;
    vol.fromJSON({
      [iosPath]: 'test',
    });

    jest.mocked(findModuleFilesAsync).mockResolvedValue([iosPath]);

    (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(true);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(findModuleFilesAsync).toHaveBeenCalledWith(projectRoot);
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(iosPath, expect.anything());
  });

  it('returns result with isSuccessful = false if local module with android folder and android folder is gitignored', async () => {
    const androidPath = `${projectRoot}/modules/HelloModule/android/build.gradle`;
    vol.fromJSON({
      [androidPath]: 'test',
    });

    jest.mocked(findModuleFilesAsync).mockResolvedValue([androidPath]);

    (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(true);

    const check = new ProjectSetupCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(findModuleFilesAsync).toHaveBeenCalledWith(projectRoot);
    expect(isFileIgnoredAsync).toHaveBeenCalledWith(androidPath, expect.anything());
  });
});
