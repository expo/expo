import { glob } from 'glob';
import { vol } from 'memfs';
import path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import { registerGlobMock } from '../../__tests__/mockHelpers';
import {
  convertPackageToProjectName,
  convertPackageWithGradleToProjectName,
  resolveExtraBuildDependenciesAsync,
  resolveModuleAsync,
} from '../android/android';

jest.mock('glob');

afterEach(() => {
  vol.reset();
  jest.resetAllMocks();
});

describe(resolveModuleAsync, () => {
  it('should not resolve module without `android` folder ', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({
        platforms: ['android'],
      }),
    });
    expect(result).toEqual(null);
  });

  it('should resolve android/build.gradle', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({
        platforms: ['android'],
        android: { path: 'android' },
      }),
    });
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      projects: [
        {
          name: 'react-native-third-party',
          sourceDir: 'node_modules/react-native-third-party/android',
          modules: [],
        },
      ],
    });
  });

  it('should contain coreFeature field', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(glob, ['android/build.gradle'], pkgDir);

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({
        platforms: ['android'],
        android: { path: 'android' },
        coreFeatures: ['jetpackcompose'],
      }),
    });
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      projects: [
        {
          name: 'react-native-third-party',
          sourceDir: 'node_modules/react-native-third-party/android',
          modules: [],
        },
      ],
      coreFeatures: ['jetpackcompose'],
    });
  });

  it('should resolve android/build.gradle.kts', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(glob, ['android/build.gradle.kts'], pkgDir);

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({ platforms: ['android'], android: { path: 'android' } }),
    });
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      projects: [
        {
          name: 'react-native-third-party',
          sourceDir: 'node_modules/react-native-third-party/android',
          modules: [],
        },
      ],
    });
  });

  it('should resolve multiple gradle files', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);

    registerGlobMock(
      glob,
      ['android/build.gradle', 'subproject/build.gradle', 'kotlinSubProject/build.gradle.kts'],
      pkgDir
    );

    const result = await resolveModuleAsync(name, {
      path: pkgDir,
      version: '0.0.1',
      config: new ExpoModuleConfig({
        platforms: ['android'],
        android: {
          path: 'android',
          projects: [
            {
              name: 'react-native-third-party$subproject',
              path: 'subproject',
            },
            {
              name: 'react-native-third-party$kotlinSubProject',
              path: 'kotlinSubProject',
            },
          ],
        },
      }),
    });
    expect(result).toEqual({
      packageName: 'react-native-third-party',
      projects: [
        {
          name: 'react-native-third-party',
          sourceDir: 'node_modules/react-native-third-party/android',
          modules: [],
        },
        {
          name: 'react-native-third-party$subproject',
          sourceDir: 'node_modules/react-native-third-party/subproject',
          modules: [],
        },
        {
          name: 'react-native-third-party$kotlinSubProject',
          sourceDir: 'node_modules/react-native-third-party/kotlinSubProject',
          modules: [],
        },
      ],
    });
  });
});

describe(convertPackageToProjectName, () => {
  it('should keep dash', () => {
    expect(convertPackageToProjectName('expo-modules-core')).toBe('expo-modules-core');
  });

  it('should convert scoped package name to dash', () => {
    expect(convertPackageToProjectName('@expo/expo-test')).toBe('expo-expo-test');
  });
});

describe(convertPackageWithGradleToProjectName, () => {
  it('should convert scoped package name to dash', () => {
    expect(convertPackageWithGradleToProjectName('@expo/expo-test', 'android/build.gradle')).toBe(
      'expo-expo-test'
    );
  });

  it('should have differentiated name for multiple projects', () => {
    expect(convertPackageWithGradleToProjectName('expo-test', 'android/build.gradle')).toBe(
      'expo-test'
    );
    expect(convertPackageWithGradleToProjectName('expo-test', 'subproject/build.gradle')).toBe(
      'expo-test$subproject'
    );
  });

  it('should support expo adapter name', () => {
    expect(
      convertPackageWithGradleToProjectName('react-native-third-party', 'expo/android/build.gradle')
    ).toBe('react-native-third-party$expo-android');
  });
});

describe(resolveExtraBuildDependenciesAsync, () => {
  it('should resolve extra build dependencies from gradle.properties', async () => {
    vol.fromJSON(
      {
        'gradle.properties':
          'android.extraMavenRepos=[{"url":"https://customers.pspdfkit.com/maven/"}]',
      },
      '/app/android'
    );
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toEqual([{ url: 'https://customers.pspdfkit.com/maven/' }]);
  });

  it('should resolve extra build dependencies from the first matched property', async () => {
    vol.fromJSON(
      {
        // the second extraMavenRepos property is ignored because we only match the first one
        'gradle.properties':
          'android.extraMavenRepos=[{"url":"https://customers.pspdfkit.com/maven/"}]\n' +
          'android.extraMavenRepos=[{"url":"https://www.example.com/maven/"}]',
      },
      '/app/android'
    );
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toEqual([{ url: 'https://customers.pspdfkit.com/maven/' }]);
  });

  it('should resolve maven dependencies for basic authentication with credentials from expo-build-properties', async () => {
    const extraMavenRepos = [
      {
        url: 'https://customers.pspdfkit.com/maven/',
        credentials: {
          username: 'user',
          password: 'password',
        },
        authentication: 'basic',
      },
    ];

    vol.fromJSON(
      { 'gradle.properties': `android.extraMavenRepos=${JSON.stringify(extraMavenRepos)}` },
      '/app/android'
    );

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toEqual(extraMavenRepos);
  });

  it('should resolve maven dependencies for http header authentication with credentials from expo-build-properties', async () => {
    const extraMavenRepos = [
      {
        url: 'https://customers.pspdfkit.com/maven/',
        credentials: {
          name: 'token',
          value: 'some_token',
        },
        authentication: 'header',
      },
    ];

    vol.fromJSON(
      { 'gradle.properties': `android.extraMavenRepos=${JSON.stringify(extraMavenRepos)}` },
      '/app/android'
    );

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toEqual(extraMavenRepos);
  });

  it('should resolve maven dependencies for digest authentication with credentials from expo-build-properties', async () => {
    const extraMavenRepos = [
      {
        url: 'https://customers.pspdfkit.com/maven/',
        credentials: {
          username: 'user',
          password: 'password',
        },
        authentication: 'digest',
      },
    ];

    vol.fromJSON(
      { 'gradle.properties': `android.extraMavenRepos=${JSON.stringify(extraMavenRepos)}` },
      '/app/android'
    );

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toEqual(extraMavenRepos);
  });

  it('should resolve maven dependencies with AWS credentials from expo-build-properties', async () => {
    const extraMavenRepos = [
      {
        url: 'https://customers.pspdfkit.com/maven/',
        credentials: {
          accessKey: 'access_key',
          secretKey: 'secret_key',
          sessionToken: 'session_token',
        },
      },
    ];

    vol.fromJSON(
      { 'gradle.properties': `android.extraMavenRepos=${JSON.stringify(extraMavenRepos)}` },
      '/app/android'
    );

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toEqual(extraMavenRepos);
  });

  it('should return null for invalid JSON', async () => {
    vol.fromJSON({ 'gradle.properties': 'android.extraMavenRepos=[{ name }]' }, '/app/android');

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toBe(null);
  });

  it('should return null if it does not contain any known properties', async () => {
    vol.fromJSON({ 'gradle.properties': '' }, '/app/android');
    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toBe(null);
  });

  it('should return null if gradle.properties not found', async () => {
    vol.fromJSON({ 'gradle.properties': null }, '/app/android');

    const extraBuildDeps = await resolveExtraBuildDependenciesAsync('/app/android');
    expect(extraBuildDeps).toBe(null);
  });
});
