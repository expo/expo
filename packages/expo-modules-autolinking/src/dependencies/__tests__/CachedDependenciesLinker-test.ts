import { vol } from 'memfs';
import type { NestedDirectoryJSON } from 'memfs/lib/volume';

import {
  makeCachedDependenciesLinker,
  scanDependencyResolutionsForPlatform,
} from '../CachedDependenciesLinker';

const projectRoot = '/fake/project';

function mockedNodeModule(
  name: string,
  options?: {
    pkgVersion?: string;
    pkgDependencies?: Record<string, string>;
  }
): NestedDirectoryJSON {
  return {
    'package.json': JSON.stringify({
      name,
      version: options?.pkgVersion ?? '0.0.1',
      dependencies: options?.pkgDependencies ?? {},
    }),
    'expo-module.config.json': JSON.stringify({
      platforms: ['ios'],
    }),
    [`${name}.podspec`]: '',
  };
}

describe(scanDependencyResolutionsForPlatform, () => {
  afterEach(() => {
    vol.reset();
  });

  it('discovers flat dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          'react-native-third-party': mockedNodeModule('react-native-third-party'),
        },
      },
      projectRoot
    );

    const linker = makeCachedDependenciesLinker({ projectRoot });
    const dependencies = await scanDependencyResolutionsForPlatform(linker, 'apple');

    expect(dependencies).toMatchInlineSnapshot(`
      {
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
          "source": 0,
          "version": "0.0.1",
        },
      }
    `);
  });

  it('excludes dependencies by name via exclude option', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'pkg-a': '*', 'pkg-b': '*' },
        }),
        'package.json': JSON.stringify({
          name: 'root',
          version: '0.0.0',
          dependencies: { 'pkg-a': '*', 'pkg-b': '*' },
          expo: {
            autolinking: {
              exclude: ['pkg-a'],
            },
          },
        }),
        node_modules: {
          'pkg-a': mockedNodeModule('pkg-a'),
          'pkg-b': mockedNodeModule('pkg-b'),
        },
      },
      projectRoot
    );

    const linker = makeCachedDependenciesLinker({ projectRoot });
    const dependencies = await scanDependencyResolutionsForPlatform(linker, 'apple');

    expect(dependencies).not.toHaveProperty('pkg-a');
    expect(dependencies).toHaveProperty('pkg-b');
  });

  it('includes non-native dependencies by name via include option', async () => {
    const nonNativeModule: NestedDirectoryJSON = {
      'package.json': JSON.stringify({
        name: 'non-native-pkg',
        version: '1.0.0',
        dependencies: {},
      }),
    };

    vol.fromNestedJSON(
      {
        'package.json': JSON.stringify({
          name: 'root',
          version: '0.0.0',
          dependencies: { 'non-native-pkg': '*' },
          expo: {
            autolinking: {
              include: ['non-native-pkg'],
            },
          },
        }),
        node_modules: {
          'non-native-pkg': nonNativeModule,
        },
      },
      projectRoot
    );

    const linker = makeCachedDependenciesLinker({ projectRoot });
    const dependencies = await scanDependencyResolutionsForPlatform(linker, 'apple');

    expect(dependencies).toHaveProperty('non-native-pkg');
  });
});
