import glob from 'fast-glob';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import { registerGlobMock } from '../../__tests__/mockHelpers';
import { convertPackageNameToProjectName, resolveModuleAsync } from '../android';

jest.mock('fast-glob');

describe(resolveModuleAsync, () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should resolve android/build.gradle', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(glob, ['android/build.gradle'], pkgDir);

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({ platforms: ['android'] }),
    });
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      projects: [
        {
          name: 'react-native-third-party',
          sourceDir: 'node_modules/react-native-third-party/android',
        },
      ],
      modules: [],
    });
  });

  it('should resolve multiple gradle files', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(glob, ['android/build.gradle', 'subproject/build.gradle'], pkgDir);

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({ platforms: ['android'] }),
    });
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      projects: [
        {
          name: 'react-native-third-party',
          sourceDir: 'node_modules/react-native-third-party/android',
        },
        {
          name: 'react-native-third-party$subproject',
          sourceDir: 'node_modules/react-native-third-party/subproject',
        },
      ],
      modules: [],
    });
  });
});

describe(convertPackageNameToProjectName, () => {
  it('should convert scoped package name to dash', () => {
    expect(convertPackageNameToProjectName('@expo/expo-test', 'android/build.gradle')).toBe(
      'expo-expo-test'
    );
  });

  it('should have differentiated name for multiple projects', () => {
    expect(convertPackageNameToProjectName('expo-test', 'android/build.gradle')).toBe('expo-test');
    expect(convertPackageNameToProjectName('expo-test', 'subproject/build.gradle')).toBe(
      'expo-test$subproject'
    );
  });

  it('should support expo adapter name', () => {
    expect(
      convertPackageNameToProjectName('react-native-third-party', 'expo/android/build.gradle')
    ).toBe('react-native-third-party$expo-android');
  });
});
