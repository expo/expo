import { vol } from 'memfs';
import type { NestedDirectoryJSON } from 'memfs/lib/volume';
import { join } from 'path';

import { scanDependenciesRecursively } from '../resolution';

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

const projectRoot = '/fake/project';

describe(scanDependenciesRecursively, () => {
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

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
        },
      }
    `);
  });

  it('discovers transitive dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          'react-native-third-party': {
            ...mockedNodeModule('react-native-third-party', {
              pkgDependencies: { 'react-native-dependency': '*' },
            }),
            node_modules: {
              'react-native-dependency': {
                ...mockedNodeModule('react-native-dependency'),
              },
            },
          },
        },
      },
      projectRoot
    );

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-dependency": {
          "depth": 1,
          "duplicates": null,
          "name": "react-native-dependency",
          "originPath": "/fake/project/node_modules/react-native-third-party/node_modules/react-native-dependency",
          "path": "/fake/project/node_modules/react-native-third-party/node_modules/react-native-dependency",
        },
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
        },
      }
    `);
  });

  it('discovers transitive, hoisted dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          'react-native-third-party': mockedNodeModule('react-native-third-party', {
            pkgDependencies: { 'react-native-dependency': '*' },
          }),
          'react-native-dependency': mockedNodeModule('react-native-dependency'),
        },
      },
      projectRoot
    );

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-dependency": {
          "depth": 1,
          "duplicates": null,
          "name": "react-native-dependency",
          "originPath": "/fake/project/node_modules/react-native-dependency",
          "path": "/fake/project/node_modules/react-native-dependency",
        },
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
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
              'react-native-third-party': mockedNodeModule('react-native-third-party', {
                pkgDependencies: { 'react-native-dependency': '*' },
              }),
            },
            'react-native-dependency@x.x.x/node_modules': {
              'react-native-dependency': mockedNodeModule('react-native-dependency'),
            },
          },
        },
      },
      projectRoot
    );

    vol.symlinkSync(
      join(
        projectRoot,
        'node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-third-party'
      ),
      join(projectRoot, 'node_modules/react-native-third-party')
    );
    vol.symlinkSync(
      join(
        projectRoot,
        'node_modules/.pnpm/react-native-dependency@x.x.x/node_modules/react-native-dependency'
      ),
      join(
        projectRoot,
        'node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-dependency'
      )
    );

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-dependency": {
          "depth": 1,
          "duplicates": null,
          "name": "react-native-dependency",
          "originPath": "/fake/project/node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-dependency",
          "path": "/fake/project/node_modules/.pnpm/react-native-dependency@x.x.x/node_modules/react-native-dependency",
        },
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-third-party",
        },
      }
    `);
  });

  it('ignores transitive, hoisted dependencies without dependents', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          'react-native-third-party': mockedNodeModule('react-native-third-party'),
          'react-native-dependency': mockedNodeModule('react-native-dependency'),
        },
      },
      projectRoot
    );

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
        },
      }
    `);
  });

  it('ignores dependency names from filter', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { ignored: '*', included: '*' },
        }),
        node_modules: {
          ignored: mockedNodeModule('ignored'),
          included: mockedNodeModule('included'),
        },
      },
      projectRoot
    );

    const result = await scanDependenciesRecursively(projectRoot, {
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
        },
      }
    `);
  });

  it('discovers transitive, duplicate dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'parent-a': '*', 'parent-b': '*' },
        }),
        node_modules: {
          'parent-a': {
            ...mockedNodeModule('parent-a', {
              pkgDependencies: { 'react-native-dependency': '*' },
            }),
            node_modules: {
              'react-native-dependency': mockedNodeModule('react-native-dependency'),
            },
          },
          'parent-b': {
            ...mockedNodeModule('parent-b', {
              pkgDependencies: { 'react-native-dependency': '*' },
            }),
            node_modules: {
              'react-native-dependency': mockedNodeModule('react-native-dependency'),
            },
          },
        },
      },
      projectRoot
    );

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "parent-a": {
          "depth": 0,
          "duplicates": null,
          "name": "parent-a",
          "originPath": "/fake/project/node_modules/parent-a",
          "path": "/fake/project/node_modules/parent-a",
        },
        "parent-b": {
          "depth": 0,
          "duplicates": null,
          "name": "parent-b",
          "originPath": "/fake/project/node_modules/parent-b",
          "path": "/fake/project/node_modules/parent-b",
        },
        "react-native-dependency": {
          "depth": 1,
          "duplicates": [
            "/fake/project/node_modules/parent-b/node_modules/react-native-dependency",
          ],
          "name": "react-native-dependency",
          "originPath": "/fake/project/node_modules/parent-a/node_modules/react-native-dependency",
          "path": "/fake/project/node_modules/parent-a/node_modules/react-native-dependency",
        },
      }
    `);
  });
});
