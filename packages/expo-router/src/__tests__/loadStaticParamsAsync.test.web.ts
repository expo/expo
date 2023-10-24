import { RouteNode } from '../Route';
import { getExactRoutes } from '../getRoutes';
import { loadStaticParamsAsync } from '../loadStaticParamsAsync';
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
          contextKey: './[color].tsx',
          dynamic: [{ deep: false, name: 'color' }],
          route: '[color]',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });

    const r = await loadStaticParamsAsync(route);

    expect(dropFunctions(r)).toEqual({
      children: [
        {
          children: [],
          contextKey: './[color].tsx',
          dynamic: [{ deep: false, name: 'color' }],
          route: '[color]',
        },
        { children: [], contextKey: './red.tsx', dynamic: null, route: 'red' },
        {
          children: [],
          contextKey: './blue.tsx',
          dynamic: null,
          route: 'blue',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });
  });

  it(`evaluates with nested dynamic routes`, async () => {
    const ctx = createMockContextModule({
      './_layout.tsx': { default() {} },
      './[color]/[shape].tsx': {
        default() {},
        async generateStaticParams({ params }) {
          return ['square', 'triangle'].map((shape) => ({
            ...params,
            shape,
          }));
        },
      },
      './[color]/_layout.tsx': {
        default() {},
        generateStaticParams() {
          return ['red', 'blue'].map((color) => ({ color }));
        },
      },
    });
    const route = getExactRoutes(ctx);

    expect(dropFunctions(route!)).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
            },
          ],
          contextKey: './[color]/_layout.tsx',
          dynamic: [{ deep: false, name: 'color' }],
          initialRouteName: undefined,
          route: '[color]',
        },
      ],
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
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
            },
            {
              children: [],
              contextKey: './[color]/square.tsx',
              dynamic: null,
              route: 'square',
            },
            {
              children: [],
              contextKey: './[color]/triangle.tsx',
              dynamic: null,
              route: 'triangle',
            },
          ],
          contextKey: './[color]/_layout.tsx',
          dynamic: [{ deep: false, name: 'color' }],
          initialRouteName: undefined,
          route: '[color]',
        },
        {
          children: [
            {
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
            },
            {
              children: [],
              contextKey: './[color]/square.tsx',
              dynamic: null,
              route: 'square',
            },
            {
              children: [],
              contextKey: './[color]/triangle.tsx',
              dynamic: null,
              route: 'triangle',
            },
          ],
          contextKey: './red/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: 'red',
        },
        {
          children: [
            {
              children: [],
              contextKey: './[color]/[shape].tsx',
              dynamic: [{ deep: false, name: 'shape' }],
              route: '[shape]',
            },
            {
              children: [],
              contextKey: './[color]/square.tsx',
              dynamic: null,
              route: 'square',
            },
            {
              children: [],
              contextKey: './[color]/triangle.tsx',
              dynamic: null,
              route: 'triangle',
            },
          ],
          contextKey: './blue/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: 'blue',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      initialRouteName: undefined,
      route: '',
    });
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
    await expect(loadStaticParamsAsync(routes)).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() must return an array of params that match the dynamic route. Received {}"`
    );
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
        { children: [], contextKey: './index.tsx', dynamic: null, route: 'index' },
        { children: [], contextKey: './foo+api.tsx', dynamic: null, route: 'foo' },
        {
          children: [],
          contextKey: './[post]+api.tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: '[post]',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        { children: [], contextKey: './index.tsx', dynamic: null, route: 'index' },
        { children: [], contextKey: './foo+api.tsx', dynamic: null, route: 'foo' },
        {
          children: [],
          contextKey: './[post]+api.tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: '[post]',
        },
      ],
      contextKey: './_layout.tsx',
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
          children: [],
          contextKey: './post/[...post].tsx',
          dynamic: [{ deep: true, name: 'post' }],
          route: 'post/[...post]',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          children: [],
          contextKey: './post/[...post].tsx',
          dynamic: [{ deep: true, name: 'post' }],
          route: 'post/[...post]',
        },
        {
          children: [],
          contextKey: './post/123/456.tsx',
          dynamic: null,
          route: 'post/123/456',
        },
      ],
      contextKey: './_layout.tsx',
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
              children: [],
              contextKey: './(app)/(index)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              route: '(index)/blog/[post]',
            },
            {
              children: [],
              contextKey: './(app)/(about)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              route: '(about)/blog/[post]',
            },
          ],
          contextKey: './(app)/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: '(app)',
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          children: [
            {
              children: [],
              contextKey: './(app)/(index)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              route: '(index)/blog/[post]',
            },
            {
              children: [],
              contextKey: './(app)/(index)/blog/123.tsx',
              dynamic: null,
              route: '(index)/blog/123',
            },
            {
              children: [],
              contextKey: './(app)/(index)/blog/abc.tsx',
              dynamic: null,
              route: '(index)/blog/abc',
            },
            {
              children: [],
              contextKey: './(app)/(about)/blog/[post].tsx',
              dynamic: [{ deep: false, name: 'post' }],
              route: '(about)/blog/[post]',
            },
            {
              children: [],
              contextKey: './(app)/(about)/blog/123.tsx',
              dynamic: null,
              route: '(about)/blog/123',
            },
            {
              children: [],
              contextKey: './(app)/(about)/blog/abc.tsx',
              dynamic: null,
              route: '(about)/blog/abc',
            },
          ],
          contextKey: './(app)/_layout.tsx',
          dynamic: null,
          initialRouteName: undefined,
          route: '(app)',
        },
      ],
      contextKey: './_layout.tsx',
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
          children: [],
          contextKey: './post/[post].tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: 'post/[post]',
        },
        {
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
        },
      ],
      contextKey: './_layout.tsx',
      dynamic: null,
      generated: true,
      route: '',
    });

    expect(dropFunctions(await loadStaticParamsAsync(route))).toEqual({
      children: [
        {
          children: [],
          contextKey: './post/[post].tsx',
          dynamic: [{ deep: false, name: 'post' }],
          route: 'post/[post]',
        },
        {
          children: [],
          contextKey: './post/123.tsx',
          dynamic: null,
          route: 'post/123',
        },
        {
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
        },
        {
          children: [],
          contextKey: './a/b/c/d/e.tsx',
          dynamic: null,
          route: 'a/b/c/d/e',
        },
      ],
      contextKey: './_layout.tsx',
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
    await expect(loadWithParam([{ post: null }])).rejects.toThrowErrorMatchingInlineSnapshot(
      `"generateStaticParams() must return an array of params that match the dynamic route. Received {"post":null}"`
    );
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
