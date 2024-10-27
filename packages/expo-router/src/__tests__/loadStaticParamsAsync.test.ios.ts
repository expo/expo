import { RouteNode } from '../Route';
import { getExactRoutes } from '../getRoutes';
import { loadStaticParamsAsync, assertStaticParams } from '../loadStaticParamsAsync';
import { RequireContext } from '../types';

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

describe(assertStaticParams, () => {
  it(`asserts parameters do not match supported dynamic properties`, () => {
    expect(() =>
      assertStaticParams(
        {
          contextKey: './[post].tsx',
          dynamic: [{ deep: false, name: 'post' }],
        },
        {
          shape: 'square',
        }
      )
    ).toThrowErrorMatchingInlineSnapshot(`
      "[./[post].tsx]: generateStaticParams() must return an array of params that match the dynamic route. Expected non-nullish values for key: "post".
      Received:
      {
        "shape": square,
        "post": undefined
      }"
    `);
  });
  it(`asserts nullish parameters`, () => {
    expect(() =>
      assertStaticParams(
        {
          contextKey: './[post]/[other].tsx',
          dynamic: [
            { deep: false, name: 'post' },
            { deep: false, name: 'other' },
          ],
        },
        {
          // @ts-expect-error: expected
          post: null,
        }
      )
    ).toThrowErrorMatchingInlineSnapshot(`
      "[./[post]/[other].tsx]: generateStaticParams() must return an array of params that match the dynamic routes. Expected non-nullish values for keys: "post", "other".
      Received:
      {
        "post": null,
        "other": undefined
      }"
    `);
  });
});

describe(loadStaticParamsAsync, () => {
  it(`evaluates a single dynamic param`, async () => {
    const route = getExactRoutes(
      createMockContextModule({
        './[color].tsx': {
          default() {},
          unstable_settings: { initialRouteName: 'index' },
          generateStaticParams() {
            return ['red', 'blue'].map((color) => ({ color }));
          },
        },
      })
    )!;

    expect(dropFunctions(route)).toEqual({
      children: [
        {
          children: [],
          type: 'route',
          contextKey: './[color].tsx',
          dynamic: [{ deep: false, name: 'color' }],
          route: '[color]',
          entryPoints: ['expo-router/build/views/Navigator.js', './[color].tsx'],
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });

    const r = await loadStaticParamsAsync(route);

    expect(dropFunctions(r)).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './[color].tsx',
          dynamic: [{ deep: false, name: 'color' }],
          route: '[color]',
          entryPoints: ['expo-router/build/views/Navigator.js', './[color].tsx'],
        },
        {
          type: 'route',
          children: [],
          contextKey: './red.tsx',
          dynamic: null,
          route: 'red',

          entryPoints: ['expo-router/build/views/Navigator.js', './[color].tsx'],
        },
        {
          type: 'route',
          children: [],
          contextKey: './blue.tsx',
          dynamic: null,
          route: 'blue',
          entryPoints: ['expo-router/build/views/Navigator.js', './[color].tsx'],
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`evaluates with nested dynamic routes`, async () => {
    const generateStaticParamsParent = jest.fn(async () => {
      return ['red', 'blue'].map((color) => ({
        color,
      }));
    });
    const generateStaticParams = jest.fn(async ({ params }) => {
      return ['square', 'triangle'].map((shape) => ({
        ...params,
        shape,
      }));
    });
    const ctx = createMockContextModule({
      './_layout.tsx': { default() {} },
      './[color]/[shape].tsx': {
        default() {},
        generateStaticParams,
      },
      './[color]/_layout.tsx': {
        default() {},
        generateStaticParams: generateStaticParamsParent,
      },
    });
    const route = getExactRoutes(ctx);

    expect(dropFunctions(route!)).toEqual({
      children: [
        {
          children: [
            {
              type: 'route',
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
          ],
          type: 'layout',
          contextKey: './[color]/_layout.tsx',
          dynamic: [{ deep: false, name: 'color' }],
          initialRouteName: undefined,
          route: '[color]',
        },
      ],
      type: 'layout',
      contextKey: './_layout.tsx',
      dynamic: null,
      initialRouteName: undefined,
      route: '',
    });

    const r = await loadStaticParamsAsync(route!);

    expect(dropFunctions(r)).toEqual({
      children: [
        {
          children: [
            {
              type: 'route',
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
          ],
          type: 'layout',
          contextKey: './[color]/_layout.tsx',
          dynamic: [{ deep: false, name: 'color' }],
          initialRouteName: undefined,
          route: '[color]',
        },
        {
          children: [
            {
              type: 'route',
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
            {
              type: 'route',
              children: [],
              contextKey: './[color]/square.tsx',
              dynamic: null,
              route: 'square',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
            {
              type: 'route',
              children: [],
              contextKey: './[color]/triangle.tsx',
              dynamic: null,
              route: 'triangle',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
          ],
          type: 'layout',
          contextKey: './red/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: 'red',
        },
        {
          children: [
            {
              type: 'route',
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
            {
              type: 'route',
              children: [],
              contextKey: './[color]/square.tsx',
              dynamic: null,
              route: 'square',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
            {
              type: 'route',
              children: [],
              contextKey: './[color]/triangle.tsx',
              dynamic: null,
              route: 'triangle',
              entryPoints: ['./_layout.tsx', './[color]/_layout.tsx', './[color]/[shape].tsx'],
            },
          ],
          type: 'layout',
          contextKey: './blue/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: 'blue',
        },
      ],
      type: 'layout',
      contextKey: './_layout.tsx',
      dynamic: null,
      initialRouteName: undefined,
      route: '',
    });

    expect(generateStaticParamsParent).toBeCalledTimes(1);
    expect(generateStaticParamsParent).toHaveBeenNthCalledWith(1, { params: {} });

    expect(generateStaticParams).toBeCalledTimes(2);
    expect(generateStaticParams).toHaveBeenNthCalledWith(1, { params: { color: 'red' } });
    expect(generateStaticParams).toHaveBeenNthCalledWith(2, { params: { color: 'blue' } });
  });

  it(`throws when required parameter is missing`, async () => {
    const routes = getExactRoutes(
      createMockContextModule({
        './post/[post].tsx': {
          default() {},
          generateStaticParams() {
            return [{}];
          },
        },
      })
    )!;
    await expect(loadStaticParamsAsync(routes)).rejects.toThrowErrorMatchingInlineSnapshot(`
      "[./post/[post].tsx]: generateStaticParams() must return an array of params that match the dynamic route. Expected non-nullish values for key: "post".
      Received:
      {
        "post": undefined
      }"
    `);
  });

  it(`preserves API routes`, async () => {
    const ctx = createMockContextModule({
      './index.tsx': {
        default() {},
      },
      './foo+api.tsx': {
        GET() {},
      },
      './[post]+api.tsx': {
        POST() {},
      },
    });

    const route = getExactRoutes(ctx, { preserveApiRoutes: true })!;

    expect(dropFunctions(route)).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './index.tsx',
          dynamic: null,
          route: 'index',
          entryPoints: ['expo-router/build/views/Navigator.js', './index.tsx'],
        },
        {
          type: 'api',
          children: [],
          contextKey: './foo+api.tsx',
          dynamic: null,
          route: 'foo',
        },
        {
          type: 'api',
          children: [],
          contextKey: './[post]+api.tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: '[post]',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './index.tsx',
          dynamic: null,
          route: 'index',
          entryPoints: ['expo-router/build/views/Navigator.js', './index.tsx'],
        },
        {
          type: 'api',
          children: [],
          contextKey: './foo+api.tsx',
          dynamic: null,
          route: 'foo',
        },
        {
          type: 'api',
          children: [],
          contextKey: './[post]+api.tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: '[post]',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`evaluates with nested deep dynamic segments`, async () => {
    const ctx = createMockContextModule({
      './post/[...post].tsx': {
        default() {},
        async generateStaticParams() {
          return [{ post: ['123', '456'] }];
        },
      },
    });

    const route = getExactRoutes(ctx)!;

    expect(dropFunctions(route)).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './post/[...post].tsx',
          dynamic: [{ deep: true, name: 'post' }],
          route: 'post/[...post]',
          entryPoints: ['expo-router/build/views/Navigator.js', './post/[...post].tsx'],
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './post/[...post].tsx',
          dynamic: [{ deep: true, name: 'post' }],
          route: 'post/[...post]',
          entryPoints: ['expo-router/build/views/Navigator.js', './post/[...post].tsx'],
        },
        {
          type: 'route',
          children: [],
          contextKey: './post/123/456.tsx',
          dynamic: null,
          route: 'post/123/456',
          entryPoints: ['expo-router/build/views/Navigator.js', './post/[...post].tsx'],
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`evaluates with nested clone syntax`, async () => {
    const ctx = createMockContextModule({
      './(app)/_layout.tsx': { default() {} },
      './(app)/(index,about)/blog/[post].tsx': {
        default() {},
        async generateStaticParams() {
          return [{ post: '123' }, { post: 'abc' }];
        },
      },
    });

    const route = getExactRoutes(ctx)!;

    expect(dropFunctions(route)).toEqual({
      children: [
        {
          children: [
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],

              route: '(index)/blog/[post]',
            },
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],

              route: '(about)/blog/[post]',
            },
          ],
          type: 'layout',
          contextKey: './(app)/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: '(app)',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          children: [
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              route: '(index)/blog/[post]',
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],
            },
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/123.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],
              route: '(index)/blog/123',
            },
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/abc.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],
              route: '(index)/blog/abc',
            },
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              route: '(about)/blog/[post]',
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],
            },
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/123.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],

              route: '(about)/blog/123',
            },
            {
              type: 'route',
              children: [],
              contextKey: './(app)/(index,about)/blog/abc.tsx',
              dynamic: null,
              entryPoints: [
                'expo-router/build/views/Navigator.js',
                './(app)/_layout.tsx',
                './(app)/(index,about)/blog/[post].tsx',
              ],
              route: '(about)/blog/abc',
            },
          ],
          type: 'layout',
          contextKey: './(app)/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: '(app)',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`generateStaticParams with nested dynamic segments`, async () => {
    const ctx = createMockContextModule({
      './post/[post].tsx': {
        default() {},
        async generateStaticParams() {
          return [{ post: '123' }];
        },
      },
      './a/[b]/c/[d]/[e].tsx': {
        default() {},
        async generateStaticParams() {
          return [{ b: 'b', d: 'd', e: 'e' }];
        },
      },
    });

    const route = getExactRoutes(ctx)!;

    expect(dropFunctions(route)).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './post/[post].tsx',
          dynamic: [{ deep: false, name: 'post' }],
          entryPoints: ['expo-router/build/views/Navigator.js', './post/[post].tsx'],
          route: 'post/[post]',
        },
        {
          type: 'route',
          children: [],
          entryPoints: ['expo-router/build/views/Navigator.js', './a/[b]/c/[d]/[e].tsx'],
          contextKey: './a/[b]/c/[d]/[e].tsx',
          dynamic: [
            {
              deep: false,
              name: 'b',
            },
            {
              deep: false,
              name: 'd',
            },
            {
              deep: false,
              name: 'e',
            },
          ],
          route: 'a/[b]/c/[d]/[e]',
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          type: 'route',
          children: [],
          contextKey: './post/[post].tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: 'post/[post]',
          entryPoints: ['expo-router/build/views/Navigator.js', './post/[post].tsx'],
        },
        {
          type: 'route',
          children: [],
          contextKey: './post/123.tsx',
          dynamic: null,
          route: 'post/123',
          entryPoints: ['expo-router/build/views/Navigator.js', './post/[post].tsx'],
        },
        {
          type: 'route',
          children: [],
          contextKey: './a/[b]/c/[d]/[e].tsx',
          dynamic: [
            {
              deep: false,
              name: 'b',
            },
            {
              deep: false,
              name: 'd',
            },
            {
              deep: false,
              name: 'e',
            },
          ],
          route: 'a/[b]/c/[d]/[e]',
          entryPoints: ['expo-router/build/views/Navigator.js', './a/[b]/c/[d]/[e].tsx'],
        },
        {
          type: 'route',
          children: [],
          contextKey: './a/b/c/d/e.tsx',
          dynamic: null,
          route: 'a/b/c/d/e',
          entryPoints: ['expo-router/build/views/Navigator.js', './a/[b]/c/[d]/[e].tsx'],
        },
      ],
      type: 'layout',
      contextKey: 'expo-router/build/views/Navigator.js',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`generateStaticParams throws when deep dynamic segments return invalid type`, async () => {
    const loadWithParam = (params) =>
      loadStaticParamsAsync(
        getExactRoutes(
          createMockContextModule({
            './post/[...post].tsx': {
              default() {},
              generateStaticParams() {
                return params;
              },
            },
          })
        )!
      );

    // Passes
    await loadWithParam([{ post: '123' }]);
    await loadWithParam([{ post: '123/456' }]);
    await loadWithParam([{ post: ['123/456', '123'] }]);
    await loadWithParam([{ post: ['123', '123'] }]);
    await loadWithParam([{ post: ['123', '/'] }]);
    await loadWithParam([{ post: [123, '/', '432'] }]);

    await expect(loadWithParam([{ post: ['/'] }])).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[...post].tsx" expected param "post" not to be empty while parsing "/"."`
    );
    await expect(loadWithParam([{ post: '' }])).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[...post].tsx" expected param "post" not to be empty while parsing ""."`
    );
    await expect(
      loadWithParam([{ post: ['', '/', ''] }])
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[...post].tsx" expected param "post" not to be empty while parsing "/"."`
    );
    await expect(loadWithParam([{ post: null }])).rejects.toThrowErrorMatchingInlineSnapshot(`
      "[./post/[...post].tsx]: generateStaticParams() must return an array of params that match the dynamic route. Expected non-nullish values for key: "post".
      Received:
      {
        "post": null
      }"
    `);
    await expect(loadWithParam([{ post: false }])).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[...post].tsx" expected param "post" to be of type string, instead found "boolean" while parsing "false"."`
    );
  });

  it(`generateStaticParams throws when dynamic segments return invalid type`, async () => {
    const ctx = createMockContextModule({
      './post/[post].tsx': {
        default() {},
        generateStaticParams() {
          return [{ post: ['123'] }];
        },
      },
    });
    const route = getExactRoutes(ctx)!;
    await expect(loadStaticParamsAsync(route)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[post].tsx" expected param "post" to be of type string, instead found "object" while parsing "123"."`
    );
  });

  it(`generateStaticParams throws when dynamic segments return invalid format (multiple slugs)`, async () => {
    const ctx = createMockContextModule({
      './post/[post].tsx': {
        default() {},
        generateStaticParams() {
          return [{ post: '123/abc' }];
        },
      },
    });
    const route = getExactRoutes(ctx)!;
    await expect(loadStaticParamsAsync(route)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[post].tsx" expected param "post" to not contain "/" (multiple segments) while parsing "123/abc"."`
    );
  });

  it(`generateStaticParams throws when dynamic segments return empty string`, async () => {
    await expect(
      loadStaticParamsAsync(
        getExactRoutes(
          createMockContextModule({
            './post/[post].tsx': {
              default() {},
              generateStaticParams() {
                return [{ post: '/' }];
              },
            },
          })
        )!
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[post].tsx" expected param "post" not to be empty while parsing "/"."`
    );
    await expect(
      loadStaticParamsAsync(
        getExactRoutes(
          createMockContextModule({
            './post/[post].tsx': {
              default() {},
              generateStaticParams() {
                return [{ post: '' }];
              },
            },
          })
        )!
      )
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() for route "./post/[post].tsx" expected param "post" not to be empty while parsing ""."`
    );
  });

  it(`generateStaticParams allows when dynamic segments return a single slug with a benign slash`, async () => {
    const ctx = createMockContextModule({
      './post/[post].tsx': {
        default() {},
        generateStaticParams() {
          return [{ post: '123/' }, { post: '/123' }];
        },
      },
    });
    // doesn't throw
    await loadStaticParamsAsync(getExactRoutes(ctx)!);
  });
});
