import { vol } from 'memfs';
import type { NestedDirectoryJSON } from 'memfs/lib/volume';
import path from 'path';

import { createMemoizer, _verifyMemoizerFreed } from '../../memoize';
import { scanDependenciesRecursively } from '../resolution';

function mockedNodeModule(
  name: string,
  options?: {
    pkgVersion?: string;
    pkgDependencies?: Record<string, string>;
    pkgDevDependencies?: Record<string, string>;
    pkgExtra?: Record<string, unknown>;
  }
): NestedDirectoryJSON {
  return {
    'package.json': JSON.stringify({
      name,
      version: options?.pkgVersion ?? '0.0.1',
      dependencies: options?.pkgDependencies ?? {},
      devDependencies: options?.pkgDevDependencies ?? {},
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

const itWithMemoize = (name: string, fn: () => Promise<void>) => {
  return it(name, async () => {
    await createMemoizer().withMemoizer(fn);
    expect(_verifyMemoizerFreed()).toBe(true);
  });
};

describe(scanDependenciesRecursively, () => {
  afterEach(() => {
    vol.reset();
  });

  itWithMemoize('discovers flat dependencies', async () => {
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

  itWithMemoize('discovers transitive dependencies', async () => {
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

  itWithMemoize('discovers transitive, hoisted dependencies', async () => {
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

  itWithMemoize('discovers transitive, isolated dependencies', async () => {
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

  itWithMemoize('discovers dependencies on nameless package.json', async () => {
    vol.fromNestedJSON(
      {
        'package.json': JSON.stringify({
          // Missing name
          dependencies: { 'react-native-third-party': '*' },
        }),
        node_modules: {
          'react-native-third-party': {
            'package.json': '{}', // Missing name
          },
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
          "version": "",
        },
      }
    `);
  });

  itWithMemoize('ignores transitive, hoisted dependencies without dependents', async () => {
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

  itWithMemoize('ignores dependency names from filter', async () => {
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

  itWithMemoize('discovers transitive, duplicate dependencies', async () => {
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
              "version": "0.0.1",
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

  itWithMemoize('allows depth to be limited', async () => {
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

  itWithMemoize('discovers transitive peer dependencies', async () => {
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

  it('resolves isolated duplicates with stable version regardless of dependency ordering', async () => {
    const runWithOrder = async (first: string, second: string) => {
      const result = await createMemoizer().withMemoizer(async () => {
        vol.fromNestedJSON(
          {
            ...mockedNodeModule('root', {
              pkgDependencies: { [first]: '*', [second]: '*' },
            }),
            node_modules: {
              '.pnpm': {
                'parent-a@1.0.0/node_modules': {
                  'parent-a': mockedNodeModule('parent-a', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { dep: '*' },
                  }),
                },
                'parent-b@1.0.0/node_modules': {
                  'parent-b': mockedNodeModule('parent-b', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { dep: '*' },
                  }),
                },
                'dep@2.0.0/node_modules': {
                  dep: mockedNodeModule('dep', { pkgVersion: '2.0.0' }),
                },
              },
            },
          },
          projectRoot
        );
        symlinkMany({
          'node_modules/parent-a': 'node_modules/.pnpm/parent-a@1.0.0/node_modules/parent-a',
          'node_modules/parent-b': 'node_modules/.pnpm/parent-b@1.0.0/node_modules/parent-b',
          'node_modules/.pnpm/parent-a@1.0.0/node_modules/dep':
            'node_modules/.pnpm/dep@2.0.0/node_modules/dep',
          'node_modules/.pnpm/parent-b@1.0.0/node_modules/dep':
            'node_modules/.pnpm/dep@2.0.0/node_modules/dep',
        });
        return await scanDependenciesRecursively(projectRoot);
      });
      expect(_verifyMemoizerFreed()).toBe(true);
      return result;
    };

    const resultAB = await runWithOrder('parent-a', 'parent-b');
    vol.reset();
    const resultBA = await runWithOrder('parent-b', 'parent-a');

    for (const key of Object.keys(resultAB)) {
      expect(resultAB[key]?.path).toBe(resultBA[key]?.path);
      expect(resultAB[key]?.version).toBe(resultBA[key]?.version);
    }
    expect(resultAB['dep']?.version).toBe('2.0.0');
  });

  it('resolves multi-level isolated duplicates with stable path and version, unstable originPath', async () => {
    const runWithOrder = async (first: string, second: string) => {
      const result = await createMemoizer().withMemoizer(async () => {
        vol.fromNestedJSON(
          {
            ...mockedNodeModule('root', {
              pkgDependencies: { [first]: '*', [second]: '*' },
            }),
            node_modules: {
              '.pnpm': {
                'parent-a@1.0.0/node_modules': {
                  'parent-a': mockedNodeModule('parent-a', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { 'shared-dep': '*' },
                  }),
                },
                'parent-b@1.0.0/node_modules': {
                  'parent-b': mockedNodeModule('parent-b', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { 'shared-dep': '*' },
                  }),
                },
                'shared-dep@2.0.0/node_modules': {
                  'shared-dep': mockedNodeModule('shared-dep', {
                    pkgVersion: '2.0.0',
                    pkgDependencies: { grandchild: '*' },
                  }),
                },
                'grandchild@3.0.0/node_modules': {
                  grandchild: mockedNodeModule('grandchild', { pkgVersion: '3.0.0' }),
                },
              },
            },
          },
          projectRoot
        );
        symlinkMany({
          'node_modules/parent-a': 'node_modules/.pnpm/parent-a@1.0.0/node_modules/parent-a',
          'node_modules/parent-b': 'node_modules/.pnpm/parent-b@1.0.0/node_modules/parent-b',
          'node_modules/.pnpm/parent-a@1.0.0/node_modules/shared-dep':
            'node_modules/.pnpm/shared-dep@2.0.0/node_modules/shared-dep',
          'node_modules/.pnpm/parent-b@1.0.0/node_modules/shared-dep':
            'node_modules/.pnpm/shared-dep@2.0.0/node_modules/shared-dep',
          'node_modules/.pnpm/shared-dep@2.0.0/node_modules/grandchild':
            'node_modules/.pnpm/grandchild@3.0.0/node_modules/grandchild',
        });
        return await scanDependenciesRecursively(projectRoot);
      });
      expect(_verifyMemoizerFreed()).toBe(true);
      return result;
    };

    const resultAB = await runWithOrder('parent-a', 'parent-b');
    vol.reset();
    const resultBA = await runWithOrder('parent-b', 'parent-a');

    for (const key of Object.keys(resultAB)) {
      expect(resultAB[key]?.path).toBe(resultBA[key]?.path);
      expect(resultAB[key]?.version).toBe(resultBA[key]?.version);
      expect(resultAB[key]?.depth).toBe(resultBA[key]?.depth);
      expect(resultAB[key]?.source).toBe(resultBA[key]?.source);
      expect(resultAB[key]?.name).toBe(resultBA[key]?.name);
    }
    expect(resultAB['shared-dep']?.version).toBe('2.0.0');
    expect(resultAB['grandchild']?.version).toBe('3.0.0');
    expect(resultAB['shared-dep']?.originPath).not.toBe(resultBA['shared-dep']?.originPath);
  });

  it('resolves mixed-depth diamond with stable path and version', async () => {
    const runWithOrder = async (first: string, second: string) => {
      const result = await createMemoizer().withMemoizer(async () => {
        vol.fromNestedJSON(
          {
            ...mockedNodeModule('root', {
              pkgDependencies: { [first]: '*', [second]: '*' },
            }),
            node_modules: {
              '.pnpm': {
                'parent-a@1.0.0/node_modules': {
                  'parent-a': mockedNodeModule('parent-a', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { 'shared-dep': '*' },
                  }),
                },
                'parent-b@1.0.0/node_modules': {
                  'parent-b': mockedNodeModule('parent-b', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { 'mid-b': '*' },
                  }),
                },
                'mid-b@1.5.0/node_modules': {
                  'mid-b': mockedNodeModule('mid-b', {
                    pkgVersion: '1.5.0',
                    pkgDependencies: { 'shared-dep': '*' },
                  }),
                },
                'shared-dep@2.0.0/node_modules': {
                  'shared-dep': mockedNodeModule('shared-dep', {
                    pkgVersion: '2.0.0',
                    pkgDependencies: { grandchild: '*' },
                  }),
                },
                'grandchild@3.0.0/node_modules': {
                  grandchild: mockedNodeModule('grandchild', { pkgVersion: '3.0.0' }),
                },
              },
            },
          },
          projectRoot
        );
        symlinkMany({
          'node_modules/parent-a': 'node_modules/.pnpm/parent-a@1.0.0/node_modules/parent-a',
          'node_modules/parent-b': 'node_modules/.pnpm/parent-b@1.0.0/node_modules/parent-b',
          'node_modules/.pnpm/parent-b@1.0.0/node_modules/mid-b':
            'node_modules/.pnpm/mid-b@1.5.0/node_modules/mid-b',
          'node_modules/.pnpm/parent-a@1.0.0/node_modules/shared-dep':
            'node_modules/.pnpm/shared-dep@2.0.0/node_modules/shared-dep',
          'node_modules/.pnpm/mid-b@1.5.0/node_modules/shared-dep':
            'node_modules/.pnpm/shared-dep@2.0.0/node_modules/shared-dep',
          'node_modules/.pnpm/shared-dep@2.0.0/node_modules/grandchild':
            'node_modules/.pnpm/grandchild@3.0.0/node_modules/grandchild',
        });
        return await scanDependenciesRecursively(projectRoot);
      });
      expect(_verifyMemoizerFreed()).toBe(true);
      return result;
    };

    const resultAB = await runWithOrder('parent-a', 'parent-b');
    vol.reset();
    const resultBA = await runWithOrder('parent-b', 'parent-a');

    for (const key of Object.keys(resultAB)) {
      expect(resultAB[key]?.path).toBe(resultBA[key]?.path);
      expect(resultAB[key]?.version).toBe(resultBA[key]?.version);
    }
    expect(resultAB['shared-dep']?.depth).toBe(1);
  });

  it('resolves isolated duplicates with stable version when three parents share a dependency', async () => {
    const runWithOrder = async (first: string, second: string) => {
      const result = await createMemoizer().withMemoizer(async () => {
        vol.fromNestedJSON(
          {
            ...mockedNodeModule('root', {
              pkgDependencies: { [first]: '*', [second]: '*', 'parent-c': '*' },
            }),
            node_modules: {
              '.pnpm': {
                'parent-a@1.0.0/node_modules': {
                  'parent-a': mockedNodeModule('parent-a', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { dep: '*' },
                  }),
                },
                'parent-b@1.0.0/node_modules': {
                  'parent-b': mockedNodeModule('parent-b', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { dep: '*' },
                  }),
                },
                'parent-c@1.0.0/node_modules': {
                  'parent-c': mockedNodeModule('parent-c', {
                    pkgVersion: '1.0.0',
                    pkgDependencies: { dep: '*' },
                  }),
                },
                'dep@2.0.0/node_modules': {
                  dep: mockedNodeModule('dep', { pkgVersion: '2.0.0' }),
                },
              },
            },
          },
          projectRoot
        );
        symlinkMany({
          'node_modules/parent-a': 'node_modules/.pnpm/parent-a@1.0.0/node_modules/parent-a',
          'node_modules/parent-b': 'node_modules/.pnpm/parent-b@1.0.0/node_modules/parent-b',
          'node_modules/parent-c': 'node_modules/.pnpm/parent-c@1.0.0/node_modules/parent-c',
          'node_modules/.pnpm/parent-a@1.0.0/node_modules/dep':
            'node_modules/.pnpm/dep@2.0.0/node_modules/dep',
          'node_modules/.pnpm/parent-b@1.0.0/node_modules/dep':
            'node_modules/.pnpm/dep@2.0.0/node_modules/dep',
          'node_modules/.pnpm/parent-c@1.0.0/node_modules/dep':
            'node_modules/.pnpm/dep@2.0.0/node_modules/dep',
        });
        return await scanDependenciesRecursively(projectRoot);
      });
      expect(_verifyMemoizerFreed()).toBe(true);
      return result;
    };

    const resultAB = await runWithOrder('parent-a', 'parent-b');
    vol.reset();
    const resultBA = await runWithOrder('parent-b', 'parent-a');

    for (const key of Object.keys(resultAB)) {
      expect(resultAB[key]?.path).toBe(resultBA[key]?.path);
      expect(resultAB[key]?.version).toBe(resultBA[key]?.version);
    }
    expect(resultAB['dep']?.version).toBe('2.0.0');
  });

  itWithMemoize('ignores transitive optional peer dependencies', async () => {
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
