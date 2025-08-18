import { vol } from 'memfs';
import type { NestedDirectoryJSON } from 'memfs/lib/volume';
import path from 'path';

import { scanDependenciesRecursively } from '../resolution';

function mockedNodeModule(
  name: string,
  options?: {
    pkgVersion?: string;
    pkgDependencies?: Record<string, string>;
    pkgExtra?: Record<string, unknown>;
  }
): NestedDirectoryJSON {
  return {
    'package.json': JSON.stringify({
      name,
      version: options?.pkgVersion ?? '0.0.1',
      dependencies: options?.pkgDependencies ?? {},
      ...options?.pkgExtra,
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
          "source": 0,
          "version": "0.0.1",
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
          "source": 0,
          "version": "0.0.1",
        },
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
          "source": 0,
          "version": "0.0.1",
        },
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

    symlinkMany({
      'node_modules/react-native-third-party':
        'node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-third-party',
      'node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-dependency':
        'node_modules/.pnpm/react-native-dependency@x.x.x/node_modules/react-native-dependency',
    });

    const result = await scanDependenciesRecursively(projectRoot);

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-dependency": {
          "depth": 1,
          "duplicates": null,
          "name": "react-native-dependency",
          "originPath": "/fake/project/node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-dependency",
          "path": "/fake/project/node_modules/.pnpm/react-native-dependency@x.x.x/node_modules/react-native-dependency",
          "source": 0,
          "version": "0.0.1",
        },
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/.pnpm/react-native-third-party@x.x.x/node_modules/react-native-third-party",
          "source": 0,
          "version": "0.0.1",
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
          "source": 0,
          "version": "0.0.1",
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
          "source": 0,
          "version": "0.0.1",
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
          "source": 0,
          "version": "0.0.1",
        },
        "parent-b": {
          "depth": 0,
          "duplicates": null,
          "name": "parent-b",
          "originPath": "/fake/project/node_modules/parent-b",
          "path": "/fake/project/node_modules/parent-b",
          "source": 0,
          "version": "0.0.1",
        },
        "react-native-dependency": {
          "depth": 1,
          "duplicates": [
            {
              "name": "react-native-dependency",
              "originPath": "/fake/project/node_modules/parent-b/node_modules/react-native-dependency",
              "path": "/fake/project/node_modules/parent-b/node_modules/react-native-dependency",
              "version": "",
            },
          ],
          "name": "react-native-dependency",
          "originPath": "/fake/project/node_modules/parent-a/node_modules/react-native-dependency",
          "path": "/fake/project/node_modules/parent-a/node_modules/react-native-dependency",
          "source": 0,
          "version": "0.0.1",
        },
      }
    `);
  });

  it('allows depth to be limited', async () => {
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

    const result = await scanDependenciesRecursively(projectRoot, { limitDepth: 1 });

    expect(result).toMatchInlineSnapshot(`
      {
        "react-native-third-party": {
          "depth": 0,
          "duplicates": null,
          "name": "react-native-third-party",
          "originPath": "/fake/project/node_modules/react-native-third-party",
          "path": "/fake/project/node_modules/react-native-third-party",
          "source": 0,
          "version": "",
        },
      }
    `);
  });

  it('discovers transitive peer dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: {
            'react-native-third-party': '*',
          },
        }),
        node_modules: {
          'react-native-third-party': mockedNodeModule('react-native-third-party', {
            pkgExtra: {
              peerDependencies: {
                'react-native-dependency': '*',
              },
            },
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
          "source": 0,
          "version": "0.0.1",
        },
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

  it('ignores transitive optional peer dependencies', async () => {
    vol.fromNestedJSON(
      {
        ...mockedNodeModule('root', {
          pkgDependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          'react-native-third-party': mockedNodeModule('react-native-third-party', {
            pkgExtra: {
              peerDependencies: {
                'react-native-third-party': '*',
              },
              peerDependenciesMeta: {
                'react-native-third-party': {
                  optional: true,
                },
              },
            },
          }),
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
          "source": 0,
          "version": "0.0.1",
        },
      }
    `);
  });
});
