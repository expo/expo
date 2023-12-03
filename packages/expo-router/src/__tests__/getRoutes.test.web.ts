import { RouteNode } from '../Route';
import {
  assertDuplicateRoutes,
  FileNode,
  getExactRoutes,
  getRecursiveTree,
  getRoutes,
  getUserDefinedTopLevelNotFoundRoute,
} from '../getRoutes';
import { RequireContext } from '../types';

function ctx(...keys: string[]) {
  return createMockContextModule(
    keys.reduce(
      (prev, curr) => ({
        ...prev,
        [curr]: { default: () => {} },
      }),
      {} as Record<string, any>
    )
  );
}

function createMockContextModule(map: Record<string, Record<string, any>> = {}) {
  const contextModule = jest.fn((key) => map[key]);

  Object.defineProperty(contextModule, 'keys', {
    value: () => Object.keys(map),
  });

  return contextModule as unknown as RequireContext;
}

function dropFunctions({ loadRoute, ...node }: RouteNode) {
  return {
    ...node,
    children: node.children.map(dropFunctions),
  };
}

const ROUTE_NOT_FOUND = {
  children: [],
  contextKey: './+not-found.tsx',
  dynamic: [{ deep: true, name: '+not-found', notFound: true }],
  generated: true,
  internal: true,
  route: '+not-found',
  entryPoints: ['expo-router/build/views/Navigator.js', 'expo-router/build/views/Unmatched.js'],
};

const ROUTE_DIRECTORY = {
  children: [],
  contextKey: './_sitemap.tsx',
  dynamic: null,
  generated: true,
  internal: true,
  route: '_sitemap',
  entryPoints: ['expo-router/build/views/Navigator.js', 'expo-router/build/views/Sitemap.js'],
};

const asFileNode = (route: Partial<FileNode>): FileNode => ({
  loadRoute(): any {
    return {
      default() {
        return null;
      },
    };
  },
  filePath: 'INVALID_TEST_VALUE',
  normalizedName: 'INVALID_TEST_VALUE',
  contextKey: 'INVALID_TEST_VALUE',
  ...route,
});

describe(assertDuplicateRoutes, () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    // @ts-expect-error
    process.env.NODE_ENV = originalEnv;
  });
  it(`throws if there are duplicate routes`, () => {
    expect(() =>
      assertDuplicateRoutes(['a.js', 'a.tsx', 'b.js'])
    ).toThrowErrorMatchingInlineSnapshot(`"Multiple files match the route name "a"."`);
  });

  it(`doesn't throw if there are no duplicate routes`, () => {
    expect(() => assertDuplicateRoutes(['a', 'b', '/c/d/e.js', 'f/g.tsx'])).not.toThrow();
  });

  it(`doesn't throw if running in production`, () => {
    // @ts-expect-error
    process.env.NODE_ENV = 'production';
    expect(() => assertDuplicateRoutes(['a', 'a.js'])).not.toThrow();
  });
});

export function getTreeForKeys(keys: string[]) {
  const routes = keys.map((normalizedName) =>
    asFileNode({
      normalizedName,
    })
  );
  return getRecursiveTree(routes).children;
}

describe(getRecursiveTree, () => {
  it(`should assert using deprecated layout route format`, () => {
    expect(() => getTreeForKeys(['(app)', '(app)/index'])).toThrowError(
      /Using deprecated Layout Route format/
    );
  });

  it(`should return a layout route`, () => {
    expect(getTreeForKeys(['(app)/_layout', '(app)/index'])).toEqual([
      {
        children: [
          {
            children: [],
            name: 'index',
            node: expect.objectContaining({
              normalizedName: '(app)/index',
            }),
            parents: ['', '(app)'],
          },
        ],
        name: '(app)',
        node: expect.objectContaining({
          normalizedName: '(app)/_layout',
        }),
        parents: [''],
      },
    ]);
  });

  it(`should return a layout route using alternative format`, () => {
    expect(getTreeForKeys(['(app)/_layout', '(app)/index'])).toEqual([
      {
        children: [
          {
            children: [],
            name: 'index',
            node: expect.objectContaining({
              normalizedName: '(app)/index',
            }),
            parents: ['', '(app)'],
          },
        ],
        name: '(app)',
        node: expect.objectContaining({
          normalizedName: '(app)/_layout',
        }),
        parents: [''],
      },
    ]);
  });
});

describe(getUserDefinedTopLevelNotFoundRoute, () => {
  it(`should match top-level not found files`, () => {
    ['./+not-found.tsx', './(group)/+not-found.tsx', './(group)/(2)/+not-found.tsx'].forEach(
      (name) => {
        expect(getUserDefinedTopLevelNotFoundRoute(getExactRoutes(ctx(name))!)).toEqual(
          expect.objectContaining({
            contextKey: name,
          })
        );
      }
    );
  });
  it(`should not match top-level deep dynamic with nested index`, () => {
    [
      './(group)/+not-found/(group).tsx',
      './(group)/+not-found/(group)/index.tsx',
      './+not-found/index.tsx',
      './+not-found/(group)/index.tsx',
      './(group1)/+not-found/(group2)/index.tsx',
      './(group1)/+not-found/(group2)/(group3)/index.tsx',
    ].forEach((name) => {
      expect(getUserDefinedTopLevelNotFoundRoute(getExactRoutes(ctx(name))!)).toEqual(null);
    });
  });

  it(`should return a basic not-found route`, () => {
    const routes = getExactRoutes(ctx('./+not-found.js'))!;
    expect(getUserDefinedTopLevelNotFoundRoute(routes)).toEqual(routes.children[0]);
  });
  it(`does not return a nested not-found route `, () => {
    expect(
      getUserDefinedTopLevelNotFoundRoute(getExactRoutes(ctx('./home/+not-found.js'))!)
    ).toEqual(null);
  });

  it(`should return a not-found route when nested in groups without layouts`, () => {
    expect(
      getUserDefinedTopLevelNotFoundRoute(
        getExactRoutes(ctx('./(group)/(another)/+not-found.tsx'))!
      )
    ).toEqual(
      expect.objectContaining({
        route: '(group)/(another)/+not-found',
      })
    );
  });
  it(`does not return a top-level not-found`, () => {
    expect(
      getUserDefinedTopLevelNotFoundRoute(
        getExactRoutes(ctx('./home/_layout.tsx', './home/+not-found.tsx'))
      )
    ).toEqual(null);
  });
});

describe(getExactRoutes, () => {
  // NOTE(EvanBacon): This tests when all you have is a root layout.
  it(`automatically blocks +html file`, () => {
    expect(
      dropFunctions(getExactRoutes(ctx('./+html.js', './other/+html.js', './_layout.tsx'))!)
    ).toEqual({
      children: [
        {
          children: [],

          entryPoints: ['./_layout.tsx', './other/+html.js'],
          contextKey: './other/+html.js',
          dynamic: null,
          route: 'other/+html',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      route: '',
    });
  });

  it(`should allow skipping entry point logic`, () => {
    expect(
      dropFunctions(getExactRoutes(ctx('./some/nested/value.tsx'), { ignoreEntryPoints: true })!)
    ).toEqual({
      children: [
        {
          children: [],
          contextKey: './some/nested/value.tsx',
          dynamic: null,
          route: 'some/nested/value',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });
});

describe(getRoutes, () => {
  // NOTE(EvanBacon): This tests when all you have is a root layout.
  it(`should allow a custom root _layout route`, () => {
    expect(dropFunctions(getRoutes(ctx('./_layout.tsx'))!)).toEqual({
      children: [
        {
          children: [],
          entryPoints: ['./_layout.tsx', 'expo-router/build/views/Unmatched.js'],
          contextKey: './+not-found.tsx',
          dynamic: [{ deep: true, name: '+not-found', notFound: true }],
          generated: true,
          internal: true,
          route: '+not-found',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      route: '',
    });
  });

  it(`should support a single nested route without layouts`, () => {
    expect(dropFunctions(getRoutes(ctx('./some/nested/value.tsx'))!)).toEqual({
      children: [
        {
          children: [],
          contextKey: './some/nested/value.tsx',
          dynamic: null,
          route: 'some/nested/value',
          entryPoints: ['expo-router/build/views/Navigator.js', './some/nested/value.tsx'],
        },
        ROUTE_DIRECTORY,
        ROUTE_NOT_FOUND,
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`get dynamic routes`, () => {
    expect(dropFunctions(getRoutes(ctx('./[dynamic].tsx', './[...deep].tsx'))!)).toEqual(
      expect.objectContaining({
        generated: true,
        children: [
          {
            children: [],
            contextKey: './[dynamic].tsx',
            dynamic: [
              {
                deep: false,
                name: 'dynamic',
              },
            ],

            entryPoints: ['expo-router/build/views/Navigator.js', './[dynamic].tsx'],
            route: '[dynamic]',
          },
          {
            children: [],
            contextKey: './[...deep].tsx',
            dynamic: [
              {
                deep: true,
                name: 'deep',
              },
            ],

            entryPoints: ['expo-router/build/views/Navigator.js', './[...deep].tsx'],
            route: '[...deep]',
          },
          ROUTE_DIRECTORY,
          ROUTE_NOT_FOUND,
          // No 404 route because we have a dynamic route
        ],
      })
    );
  });

  it(`should convert a complex context module routes`, () => {
    expect(
      dropFunctions(
        getRoutes(
          ctx(
            './(stack)/_layout.tsx',
            './(stack)/home.tsx',
            './(stack)/settings.tsx',
            './(stack)/user/(default)/_layout.tsx',
            './(stack)/user/(default)/posts.tsx',
            './(stack)/user/profile.tsx',
            './(stack)/user/[profile].tsx',
            './(stack)/user/settings/_layout.tsx',
            './(stack)/user/settings/info.tsx',
            './(stack)/user/settings/[...other].tsx',
            './another.tsx',
            './some/nested/value.tsx'
          )
        )!
      )
    ).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              contextKey: './(stack)/home.tsx',
              dynamic: null,
              route: 'home',
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(stack)/_layout.tsx',
                './(stack)/home.tsx',
              ],
            },
            {
              children: [],
              contextKey: './(stack)/settings.tsx',
              dynamic: null,
              route: 'settings',
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(stack)/_layout.tsx',
                './(stack)/settings.tsx',
              ],
            },
            {
              children: [
                {
                  children: [],
                  contextKey: './(stack)/user/(default)/posts.tsx',
                  dynamic: null,
                  entryPoints: [
                    'expo-router/build/views/Navigator.js',
                    './(stack)/_layout.tsx',
                    './(stack)/user/(default)/_layout.tsx',
                    './(stack)/user/(default)/posts.tsx',
                  ],
                  route: 'posts',
                },
              ],
              contextKey: './(stack)/user/(default)/_layout.tsx',
              dynamic: null,
              route: 'user/(default)',
            },
            {
              children: [],
              contextKey: './(stack)/user/profile.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(stack)/_layout.tsx',
                './(stack)/user/profile.tsx',
              ],
              route: 'user/profile',
            },
            {
              children: [],
              contextKey: './(stack)/user/[profile].tsx',
              dynamic: [
                {
                  deep: false,
                  name: 'profile',
                },
              ],
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(stack)/_layout.tsx',
                './(stack)/user/[profile].tsx',
              ],
              route: 'user/[profile]',
            },
            {
              children: [
                {
                  children: [],
                  contextKey: './(stack)/user/settings/info.tsx',
                  dynamic: null,
                  entryPoints: [
                    'expo-router/build/views/Navigator.js',
                    './(stack)/_layout.tsx',
                    './(stack)/user/settings/_layout.tsx',
                    './(stack)/user/settings/info.tsx',
                  ],
                  route: 'info',
                },
                {
                  children: [],
                  entryPoints: [
                    'expo-router/build/views/Navigator.js',
                    './(stack)/_layout.tsx',
                    './(stack)/user/settings/_layout.tsx',
                    './(stack)/user/settings/[...other].tsx',
                  ],
                  contextKey: './(stack)/user/settings/[...other].tsx',
                  dynamic: [{ deep: true, name: 'other' }],
                  route: '[...other]',
                },
              ],
              contextKey: './(stack)/user/settings/_layout.tsx',
              dynamic: null,
              route: 'user/settings',
            },
          ],
          contextKey: './(stack)/_layout.tsx',
          dynamic: null,
          route: '(stack)',
        },
        {
          children: [],
          contextKey: './another.tsx',
          dynamic: null,
          entryPoints: ['expo-router/build/views/Navigator.js', './another.tsx'],
          route: 'another',
        },
        {
          children: [],
          entryPoints: ['expo-router/build/views/Navigator.js', './some/nested/value.tsx'],
          contextKey: './some/nested/value.tsx',
          dynamic: null,
          route: 'some/nested/value',
        },
        ROUTE_DIRECTORY,
        ROUTE_NOT_FOUND,
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });
  it(`should convert an empty context module to routes`, () => {
    expect(getRoutes(ctx())).toBeNull();
  });
});
