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
});
