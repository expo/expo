import { vol } from 'memfs';
import type { NestedDirectoryJSON } from 'memfs/lib/volume';
import path from 'path';

import { scanDependenciesInSearchPath } from '../scanning';

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
  };
}

const symlinkMany = (symlinks: Record<string, string>) => {
  for (const from in symlinks) {
    vol.mkdirSync(path.dirname(path.join(projectRoot, from)), { recursive: true });
    vol.symlinkSync(path.join(projectRoot, symlinks[from]), path.join(projectRoot, from));
  }
};

const projectRoot = '/fake/project';
const projectRootNodeModules = '/fake/project/node_modules';

describe(scanDependenciesInSearchPath, () => {
  afterEach(() => {
    vol.reset();
  });

  it('discovers unscoped and scoped dependencies', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          'react-native-third-party': mockedNodeModule('react-native-third-party'),
          '@my/expo-module': mockedNodeModule('@my/expo-module'),
        },
      },
      projectRoot
    );

    const result = await scanDependenciesInSearchPath(projectRootNodeModules);

    expect(result).toMatchInlineSnapshot(`
      {
        "@my/expo-module": {
          "depth": 0,
          "duplicates": null,
          "name": "@my/expo-module",
          "originPath": "/fake/project/node_modules/@my/expo-module",
          "path": "/fake/project/node_modules/@my/expo-module",
          "source": 1,
          "version": "0.0.1",
        },
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
          "source": 1,
          "version": "0.0.1",
        },
      }
    `);
  });

  it('discovers symlinked dependencies', async () => {
    vol.fromNestedJSON(
      {
        'react-native-third-party': mockedNodeModule('react-native-third-party'),
        node_modules: {
          '.keep': '',
        },
      },
      projectRoot
    );

    symlinkMany({
      'node_modules/react-native-third-party': 'react-native-third-party',
    });

    const result = await scanDependenciesInSearchPath(projectRootNodeModules);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/react-native-third-party",
          "source": 1,
          "version": "0.0.1",
        },
      }
    `);
  });

  it('discovers transitive, isolated dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          '.pnpm': {
            'react-native-third-party@x.x.x/node_modules': {
              'react-native-third-party': mockedNodeModule('react-native-third-party'),
            },
          },
        },
      },
      projectRoot
    );

    symlinkMany({
      'node_modules/react-native-third-party':
        'node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-third-party',
    });

    const result = await scanDependenciesInSearchPath(projectRootNodeModules);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-third-party",
          "source": 1,
          "version": "0.0.1",
        },
      }
    `);
  });

  it('resolves conflicts as duplicates', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          b: mockedNodeModule('duplicate'),
          a: mockedNodeModule('duplicate'),
        },
      },
      projectRoot
    );

    const result = await scanDependenciesInSearchPath(projectRootNodeModules);

    expect(result).toMatchInlineSnapshot(`
      {
        "duplicate": {
          "depth": 0,
          "duplicates": [
            {
              "name": "duplicate",
              "originPath": "/fake/project/node_modules/b",
              "path": "/fake/project/node_modules/b",
              "version": "0.0.1",
            },
          ],
          "name": "duplicate",
          "originPath": "/fake/project/node_modules/a",
          "path": "/fake/project/node_modules/a",
          "source": 1,
          "version": "0.0.1",
        },
      }
    `);
  });

  it('ignores missing package.json files on dependencies', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          'react-native-third-party': { '.keep': '' },
          '@my/expo-module': { '.keep': '' },
        },
      },
      projectRoot
    );

    const result = await scanDependenciesInSearchPath(projectRootNodeModules);

    expect(result).toMatchInlineSnapshot(`
      {
        "@my/expo-module": {
          "depth": 0,
          "duplicates": null,
          "name": "@my/expo-module",
          "originPath": "/fake/project/node_modules/@my/expo-module",
          "path": "/fake/project/node_modules/@my/expo-module",
          "source": 1,
          "version": "",
        },
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
          "source": 1,
          "version": "",
        },
      }
    `);
  });

  it('ignores files', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          'react-native-third-party': 'content',
          '@my/expo-module': 'content',
        },
      },
      projectRoot
    );

    const result = await scanDependenciesInSearchPath(projectRootNodeModules);
    expect(result).toEqual({});
  });

  it('ignores dependency names from filter', async () => {
    vol.fromNestedJSON(
      {
        node_modules: {
          ignored: mockedNodeModule('ignored'),
          included: mockedNodeModule('included'),
        },
      },
      projectRoot
    );

    const result = await scanDependenciesInSearchPath(projectRootNodeModules, {
      shouldIncludeDependency: (dependencyName) => dependencyName !== 'ignored',
    });

    expect(result).toMatchInlineSnapshot(`
      {
        "included": {
          "depth": 0,
          "duplicates": null,
          "name": "included",
          "originPath": "/fake/project/node_modules/included",
          "path": "/fake/project/node_modules/included",
          "source": 1,
          "version": "0.0.1",
        },
      }
    `);
  });
});
