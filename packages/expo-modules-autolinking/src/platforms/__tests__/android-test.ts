import { vol } from 'memfs';
import * as path from 'path';

import { ExpoModuleConfig } from '../../ExpoModuleConfig';
import {
  convertPackageToProjectName,
  convertPackageWithGradleToProjectName,
  resolveExtraBuildDependenciesAsync,
  resolveModuleAsync,
} from '../android/android';

afterEach(() => {
  vol.reset();
  jest.resetAllMocks();
});

describe(resolveModuleAsync, () => {
  it('should not resolve module without `android` folder ', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);
    const result = await resolveModuleAsync(name, {
      name,
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
      name,
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
          modulesV2: [],
          services: [],
          packages: [],
        },
      ],
    });
  });

  it('should contain coreFeature field', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);
    const result = await resolveModuleAsync(name, {
      name,
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
          modulesV2: [],
          services: [],
          packages: [],
        },
      ],
      coreFeatures: ['jetpackcompose'],
    });
  });

  it('should resolve android/build.gradle.kts', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);
    const result = await resolveModuleAsync(name, {
      name,
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
          modulesV2: [],
          services: [],
          packages: [],
        },
      ],
    });
  });

  describe('symlinked package path', () => {
    const storeDir =
      '/app/node_modules/.pnpm/react-native-third-party@1.0.0_patch_hash=abc/node_modules/react-native-third-party';
    const linkDir = '/app/lib/node_modules/react-native-third-party';

    beforeEach(() => {
      vol.fromJSON({
        [path.join(storeDir, 'third-party-gradle-plugin', 'build.gradle.kts')]: '',
        [path.join(storeDir, 'android', 'build.gradle')]: '',
      });
      vol.mkdirSync(path.dirname(linkDir), { recursive: true });
      vol.symlinkSync(storeDir, linkDir);
    });

    it('should resolve symlinks in the gradle plugin sourceDir', async () => {
      const name = 'react-native-third-party';
      const result = await resolveModuleAsync(name, {
        name,
        path: linkDir,
        version: '1.0.0',
        config: new ExpoModuleConfig({
          platforms: ['android'],
          android: {
            gradlePlugins: [
              {
                id: 'third-party-gradle-plugin',
                group: 'com.thirdparty',
                sourceDir: 'third-party-gradle-plugin',
                applyToRootProject: true,
              },
            ],
          },
        }),
      });
      expect(result?.plugins).toEqual([
        {
          id: 'third-party-gradle-plugin',
          group: 'com.thirdparty',
          sourceDir: path.join(storeDir, 'third-party-gradle-plugin'),
          applyToRootProject: true,
        },
      ]);
    });

    it('should keep the symlinked project sourceDir', async () => {
      const name = 'react-native-third-party';
      const result = await resolveModuleAsync(name, {
        name,
        path: linkDir,
        version: '1.0.0',
        config: new ExpoModuleConfig({
          platforms: ['android'],
          android: { path: 'android' },
        }),
      });
      expect(result?.projects?.[0]?.sourceDir).toBe(path.join(linkDir, 'android'));
    });

    it('should fall back to the unresolved path when the gradle plugin sourceDir is missing', async () => {
      const name = 'react-native-third-party';
      const result = await resolveModuleAsync(name, {
        name,
        path: linkDir,
        version: '1.0.0',
        config: new ExpoModuleConfig({
          platforms: ['android'],
          android: {
            gradlePlugins: [
              {
                id: 'missing-gradle-plugin',
                group: 'com.thirdparty',
                sourceDir: 'missing-gradle-plugin',
              },
            ],
          },
        }),
      });
      expect(result?.plugins?.[0]?.sourceDir).toBe(path.join(linkDir, 'missing-gradle-plugin'));
    });
  });

  it('should resolve multiple gradle files', async () => {
    const name = 'react-native-third-party';
    const pkgDir = path.join('node_modules', name);
    const result = await resolveModuleAsync(name, {
      name,
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
          modulesV2: [],
          services: [],
          packages: [],
        },
        {
          name: 'react-native-third-party$subproject',
          sourceDir: 'node_modules/react-native-third-party/subproject',
          modules: [],
          modulesV2: [],
          services: [],
          packages: [],
        },
        {
          name: 'react-native-third-party$kotlinSubProject',
          sourceDir: 'node_modules/react-native-third-party/kotlinSubProject',
          modules: [],
          modulesV2: [],
          services: [],
          packages: [],
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
