import { vol } from 'memfs';
import * as path from 'path';
import { existsAndIsNotIgnoredAsync } from '../../utils/files';
import { AppConfigFieldsNotSyncedToNativeProjectsCheck } from '../AppConfigFieldsNotSyncedToNativeProjectsCheck';
import { env } from '../../utils/env';

jest.mock('fs');
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

describe('runAsync', () => {
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('returns result with isSuccessful = true if no ios/android folders and no config plugins', async () => {
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = true if ios/android folders but no config plugins', async () => {
    vol.fromJSON({
      [projectRoot + '/ios/something.pbxproj']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('returns result with isSuccessful = false with ios/ android folders and config plugins present, not in gitignore', async () => {
    jest.mocked(existsAndIsNotIgnoredAsync).mockResolvedValue(true);

    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
      },
    });
    expect(result.isSuccessful).toBeFalsy();
  });

  it('returns result with isSuccessful = true with ios/ android folders and config plugins present, in gitignore', async () => {
    jest.mocked(existsAndIsNotIgnoredAsync).mockResolvedValue(false);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
      },
    });
    expect(result.isSuccessful).toBeTruthy();
  });

  it('does not add Android Gradle cache advice during EAS iOS builds', async () => {
    jest.spyOn(env, 'EAS_BUILD_PLATFORM', 'get').mockReturnValue('ios');

    vol.fromJSON({
      [path.resolve('eas.json')]: '{}',
    });

    jest.mocked(existsAndIsNotIgnoredAsync).mockImplementation(async (p, _checkEasignore) => {
      if (p === path.join(projectRoot, 'android', 'build.gradle')) return true;
      if (p === path.join(projectRoot, 'android', '.gradle')) return false;
      return false;
    });

    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: { name: 'name', slug: 'slug', android: {} },
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Add '/ios' to your .gitignore file"),
        expect.not.stringContaining(".gradle' to your .gitignore"),
      ])
    );
  });

  it('does not add Android Gradle cache advice when android/.gradle is not tracked during EAS Android builds', async () => {
    jest.spyOn(env, 'EAS_BUILD_PLATFORM', 'get').mockReturnValue('android');

    vol.fromJSON({
      [path.resolve('eas.json')]: '{}',
    });

    jest.mocked(existsAndIsNotIgnoredAsync).mockImplementation(async (p, _checkEasignore) => {
      if (p === path.join(projectRoot, 'android', 'build.gradle')) return true;
      if (p === path.join(projectRoot, 'android', '.gradle')) return false;
      return false;
    });

    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: { name: 'name', slug: 'slug', android: {} },
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Add '/android' to your .gitignore file"),
        expect.not.stringContaining("add '/android/.gradle' to your .gitignore"),
      ])
    );
  });

  it('adds Android Gradle cache advice when android/.gradle is tracked during EAS Android builds', async () => {
    jest.spyOn(env, 'EAS_BUILD_PLATFORM', 'get').mockReturnValue('android');

    vol.fromJSON({
      [path.resolve('eas.json')]: '{}',
    });

    jest.mocked(existsAndIsNotIgnoredAsync).mockResolvedValue(true);

    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: { name: 'name', slug: 'slug', android: {} },
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.advice).toEqual(
      expect.arrayContaining([expect.stringContaining("add '/android/.gradle' to your .gitignore")])
    );
  });

  it('mentions app.config.ts in issue when dynamic config is used', async () => {
    jest.mocked(existsAndIsNotIgnoredAsync).mockResolvedValue(true);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        plugins: ['expo-something'],
        ios: {},
        android: {},
      },
      dynamicConfigPath: '/tmp/project/app.config.ts',
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues[0]).toContain('app.config.ts');
    expect(result.issues[0]).toContain('ios');
    expect(result.issues[0]).toContain('android');
    expect(result.issues[0]).toContain('plugins');
  });

  it('reports multiple unsynced fields correctly', async () => {
    jest.mocked(existsAndIsNotIgnoredAsync).mockResolvedValue(true);
    vol.fromJSON({
      [projectRoot + '/ios/Podfile']: 'test',
    });
    const check = new AppConfigFieldsNotSyncedToNativeProjectsCheck();
    const result = await check.runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
      exp: {
        name: 'name',
        slug: 'slug',
        ios: {},
        android: {},
        splash: {},
        icon: 'path/to/icon.png',
      },
      staticConfigPath: '/tmp/project/app.json',
    });

    expect(result.isSuccessful).toBeFalsy();
    expect(result.issues[0]).toContain('app.json');
    expect(result.issues[0]).toContain('ios');
    expect(result.issues[0]).toContain('android');
    expect(result.issues[0]).toContain('splash');
    expect(result.issues[0]).toContain('icon');
  });
});
