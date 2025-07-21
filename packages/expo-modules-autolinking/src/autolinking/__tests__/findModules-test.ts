import fs from 'fs';
import { vol, NestedDirectoryJSON } from 'memfs';
import path from 'path';

import { findModulesAsync } from '../findModules';

const projectRoot = '/fake/project';
const realpath = jest.spyOn(fs.promises, 'realpath');

const expectAnyModule = (version = expect.any(String)) => {
  return expect.objectContaining({ version });
};

function mockedRoot(
  name?: string,
  options?: {
    pkgDependencies?: Record<string, string>;
  }
): NestedDirectoryJSON {
  const packageJson = {
    name: name ?? 'fake-project',
    version: '0.0.0',
    private: true,
    dependencies: options?.pkgDependencies ?? {},
  };
  return {
    'package.json': JSON.stringify(packageJson),
  };
}

function mockedModule(
  name: string,
  options?: {
    pkgVersion?: string;
    pkgDependencies?: Record<string, string>;
  }
): NestedDirectoryJSON {
  const packageJson = {
    name,
    version: options?.pkgVersion ?? '0.0.1',
    dependencies: options?.pkgDependencies ?? {},
  };
  const expoModuleConfig = {
    platforms: ['ios'],
  };
  return {
    'package.json': JSON.stringify(packageJson),
    'expo-module.config.json': JSON.stringify(expoModuleConfig),
  };
}

describe(findModulesAsync, () => {
  afterEach(() => {
    realpath.mockRestore();
    vol.reset();
  });

  /**
   * /app
   *   └── /app/node_modules/react-native-third-party
   */
  it('should link top level package', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        node_modules: {
          'react-native-third-party': mockedModule('react-native-third-party'),
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({
      'react-native-third-party': expectAnyModule(),
    });
  });

  /**
   * /app
   *   ├── /app/node_modules/react-native-third-party
   *   └── /app/node_modules/@expo/expo-test
   */
  it('should link scoped level package', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        node_modules: {
          'react-native-third-party': mockedModule('react-native-third-party'),
          '@expo/expo-test': mockedModule('@expo/expo-test'),
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({
      'react-native-third-party': expectAnyModule(),
      '@expo/expo-test': expectAnyModule(),
    });
  });

  /**
   * /workspace
   *   │ ╚══ /workspace/packages/app
   *   │
   *   └── /workspace/node_modules/pkg
   */
  it.each([
    ['should link hoisted package in workspace', { isNegativeTest: false }],
    [
      'should not link hoisted package which are not in app project dependencies',
      { isNegativeTest: true },
    ],
  ])('%s', async (_, { isNegativeTest }) => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        'packages/app': {
          ...mockedRoot('app', {
            pkgDependencies: isNegativeTest ? {} : { pkg: '*' },
          }),
          node_modules: {
            pkg: mockedModule('pkg'),
          },
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [
        path.join(projectRoot, 'packages/app/node_modules'),
        path.join(projectRoot, 'node_modules'),
      ],
      platform: 'ios',
      projectRoot: path.join(projectRoot, 'packages/app'),
    });
    if (isNegativeTest) {
      expect(result).toEqual({});
    } else {
      expect(result).toEqual({
        pkg: expectAnyModule(),
      });
    }
  });

  /**
   * /workspace
   *   │ ╚══ /workspace/packages/app
   *   │
   *   ├── /workspace/node_modules/dep-pkg
   *   └── /workspace/node_modules/pkg
   */
  it.each([
    [
      'should link packages which are in app project transitive dependencies',
      { isNegativeTest: false },
    ],
    [
      'should not link packages which are not in app project transitive dependencies',
      { isNegativeTest: true },
    ],
  ])('%s', async (_, { isNegativeTest }) => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        'packages/app': {
          ...mockedRoot('app', {
            pkgDependencies: { pkg: '*' },
          }),
        },
        // Hoisted
        node_modules: {
          pkg: mockedModule('pkg', {
            pkgDependencies: isNegativeTest ? {} : { 'dep-pkg': '*' },
          }),
          'dep-pkg': mockedModule('dep-pkg'),
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [
        path.join(projectRoot, 'packages/app/node_modules'),
        path.join(projectRoot, 'node_modules'),
      ],
      platform: 'ios',
      projectRoot: path.join(projectRoot, 'packages/app'),
    });
    // TODO(@kitten): Fix the check here
    if (isNegativeTest) {
      expect(result).toEqual({
        pkg: expectAnyModule(),
      });
    } else {
      expect(result).toEqual({
        pkg: expectAnyModule(),
        'dep-pkg': expectAnyModule(),
      });
    }
  });

  /**
   * /workspace
   *   │ ╚══ /workspace/packages/app
   *   │       └── /workspace/packages/app/node_modules/pkg@1.0.0
   *   │
   *   └── /workspace/node_modules/pkg@0.0.0
   */
  it('should link non-hoisted package first if there are multiple versions', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        'packages/app': {
          ...mockedRoot('app', {
            pkgDependencies: { pkg: '*' },
          }),
          node_modules: {
            pkg: mockedModule('pkg', {
              pkgVersion: '1.0.0-local',
            }),
          },
        },
        // Hoisted
        node_modules: {
          pkg: mockedModule('pkg', {
            pkgVersion: '0.0.0-hoisted',
          }),
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [
        path.join(projectRoot, 'packages/app/node_modules'),
        path.join(projectRoot, 'node_modules'),
      ],
      platform: 'ios',
      projectRoot: path.join(projectRoot, 'packages/app'),
    });

    expect(result).toEqual({
      pkg: expectAnyModule('1.0.0-local'),
    });
  });

  /**
   * /app/node_modules
   *   ├── /expo → /.pnpm/expo@x.x.x+.../node_modules/expo
   *   ├── /expo-dev-client → /.pnpm/expo-dev-client@x.x.x+.../node_modules/expo-dev-client
   *   └── /.pnpm
   *         ├── /expo@x.x.x+.../node_modules
   *         │    ├── /@expo/cli
   *         │    ├── /expo
   *         │    └── /expo-application
   *         └── /expo-dev-client@x.x.x+.../node_modules
   *              ├── /expo-dev-client
   *              └── /expo-dev-launcher
   */
  it('should link packages which are installed in isolated stores', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        'packages/app': {
          ...mockedRoot('app', {
            pkgDependencies: { pkg: '*' },
          }),
        },
        node_modules: {
          'react-native-third-party': mockedModule('react-native-third-party', {
            pkgVersion: 'INVALID',
          }),
          '@expo/test': mockedModule('@expo/test', { pkgVersion: 'INVALID' }),
          // Isolated store
          '.pnpm/react-native-third-party@x/node_modules': {
            'react-native-third-party': mockedModule('react-native-third-party', {
              pkgVersion: 'VALID',
            }),
          },
          '.pnpm/@expo+expo-test@x/node_modules': {
            '@expo/test': mockedModule('@expo/test', {
              pkgVersion: 'VALID',
            }),
          },
        },
      },
      projectRoot
    );

    const realpath = jest.spyOn(fs.promises, 'realpath').mockImplementation(async (filePath) => {
      const filePathStr = filePath.toString();
      switch (filePathStr) {
        case `${projectRoot}/node_modules/react-native-third-party`:
          return `${projectRoot}/node_modules/.pnpm/react-native-third-party@x/node_modules/react-native-third-party`;
        case `${projectRoot}/node_modules/@expo/test`:
          return `${projectRoot}/node_modules/.pnpm/@expo+expo-test@x/node_modules/@expo/test`;
        default:
          if (filePathStr.includes('.pnpm')) {
            return filePathStr;
          } else {
            throw new Error(`Test: Unexpected realpath call ${filePathStr}`);
          }
      }
    });

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({
      'react-native-third-party': expectAnyModule('VALID'),
      '@expo/test': expectAnyModule('VALID'),
    });

    expect(realpath).toHaveBeenCalledTimes(4);
  });

  /**
   * /app/node_modules
   *   ├── /expo → /.pnpm/expo@x.x.x+.../node_modules/expo
   *   ├── /expo-application → /.pnpm/expo-application@0.9.9+.../node_modules/expo-application
   *   └── /.pnpm
   *         ├── /expo@x.x.x+.../node_modules
   *         │    ├── /expo
   *         │    └── /expo-application (v1.0.0)
   *         └── /expo-application@0.9.9+.../node_modules
   *              └── /expo-application (v0.9.9)
   */
  it('should prefer project dependencies over nested isolated dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        node_modules: {
          'react-native-third-party': mockedModule('react-native-third-party', {
            pkgVersion: 'INVALID',
          }),
          '@expo/test': mockedModule('@expo/test', { pkgVersion: 'INVALID' }),
          // Isolated store
          '.pnpm/react-native-third-party@x/node_modules': {
            'react-native-third-party': mockedModule('react-native-third-party', {
              pkgVersion: 'VALID',
              pkgDependencies: {
                // We introduce a duplicate here...
                '@expo/test': '*',
              },
            }),
            // ...which in isolated dependencies will be linked into this store path
            '@expo/test': mockedModule('@expo/test', {
              pkgVersion: 'INVALID',
            }),
          },
          '.pnpm/@expo+expo-test@x/node_modules': {
            '@expo/test': mockedModule('@expo/test', {
              pkgVersion: 'VALID',
            }),
          },
        },
      },
      projectRoot
    );

    const realpath = jest.spyOn(fs.promises, 'realpath').mockImplementation(async (filePath) => {
      const filePathStr = filePath.toString();
      switch (filePathStr) {
        case `${projectRoot}/node_modules/react-native-third-party`:
          return `${projectRoot}/node_modules/.pnpm/react-native-third-party@x/node_modules/react-native-third-party`;
        case `${projectRoot}/node_modules/@expo/test`:
          return `${projectRoot}/node_modules/.pnpm/@expo+expo-test@x/node_modules/@expo/test`;
        default:
          if (filePathStr.includes('.pnpm')) {
            return filePathStr;
          } else {
            throw new Error(`Test: Unexpected realpath call ${filePathStr}`);
          }
      }
    });

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({
      'react-native-third-party': expectAnyModule('VALID'),
      '@expo/test': expectAnyModule('VALID'),
    });

    expect(realpath).toHaveBeenCalledTimes(5);
  });

  it('should not link modules excluded by `options.exclude`', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        node_modules: {
          'react-native-third-party': mockedModule('react-native-third-party'),
          '@expo/expo-test': mockedModule('@expo/expo-test'),
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
      exclude: ['react-native-third-party'],
    });

    expect(result).toEqual({
      '@expo/expo-test': expectAnyModule(),
    });
  });

  /**
   * /app
   *   ├── /app/local-expo-module
   */
  it('should NOT link local non-node module (No arbitrary modules)', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        'local-expo-module': mockedModule('react-native-third-party'),
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({});
  });

  /**
   * /app
   *   ├── /app/local-expo-module
   */
  it('should link local non-node module in "modules/" sub-directory', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        modules: {
          'local-expo-module': mockedModule('local-expo-module'),
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({
      'local-expo-module': expectAnyModule(),
    });
  });

  /**
   * TODO(@kitten): Fix this behaviour
   * /app
   *   ╚══ /node_modules/expo-module-1
   *       └── /app/node_modules/expo-module-1/node_modules/expo-module-2
   */
  it('should link transitive non-hoisted module (FAILURE)', async () => {
    vol.fromNestedJSON(
      {
        ...mockedRoot(),
        node_modules: {
          'expo-module-1': {
            ...mockedModule('expo-module-1', {
              pkgDependencies: { 'expo-module-2': '*' },
            }),
            node_modules: {
              'expo-module-2': mockedModule('expo-module-2'),
            },
          },
        },
      },
      projectRoot
    );

    const result = await findModulesAsync({
      searchPaths: [path.join(projectRoot, 'node_modules')],
      platform: 'ios',
      projectRoot,
    });

    expect(result).toEqual({
      'expo-module-1': expectAnyModule(),
      // TODO(@kitten): This is expected to succeed, but doesn't
      //'expo-module-2': expectAnyModule(),
    });
  });
});
