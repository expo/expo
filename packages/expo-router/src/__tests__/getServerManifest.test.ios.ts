import { getExactRoutes } from '../getRoutes';
import { getServerManifest, parseParameter } from '../getServerManifest';
import { RequireContext } from '../types';

function createMockContextModule(map: Record<string, Record<string, any>> = {}) {
  const contextModule = jest.fn((key) => map[key]);

  Object.defineProperty(contextModule, 'keys', {
    value: () => Object.keys(map),
  });

  return contextModule as unknown as RequireContext;
}

function getRoutesFor(files: string[]) {
  return getExactRoutes(
    createMockContextModule(Object.fromEntries(files.map((file) => [file, { default() {} }]))),
    {
      preserveApiRoutes: true,
    }
  )!;
}

it(`sorts different route types`, () => {
  expect(
    getServerManifest(
      getRoutesFor(['./a.js', './b+api.tsx', './+not-found.ts', './c/+not-found.tsx'])
    )
  ).toEqual({
    apiRoutes: [
      expect.objectContaining({
        file: './b+api.tsx',
      }),
    ],
    htmlRoutes: [
      expect.objectContaining({
        file: './a.js',
      }),
    ],
    notFoundRoutes: [
      expect.objectContaining({
        file: './c/+not-found.tsx',
      }),
      expect.objectContaining({
        file: './+not-found.ts',
      }),
    ],
  });
});

it(`converts a server manifest`, () => {
  expect(getServerManifest(getRoutesFor(['./home.js', './api/[post]+api.tsx']))).toEqual({
    apiRoutes: [
      {
        file: './api/[post]+api.tsx',
        namedRegex: '^/api/(?<post>[^/]+?)(?:/)?$',
        page: '/api/[post]',
        routeKeys: { post: 'post' },
      },
    ],
    htmlRoutes: [{ file: './home.js', namedRegex: '^/home(?:/)?$', page: '/home', routeKeys: {} }],
    notFoundRoutes: [],
  });
});

// https://github.com/expo/expo/issues/29883
it(`converts a server manifest with nested root group and layout`, () => {
  expect(getServerManifest(getRoutesFor(['./(root)/index.js', './(root)/_layout.js']))).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(root)/index.js',
        page: '/(root)/index',
        namedRegex: '^(?:/\\(root\\))?(?:/)?$',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });
});
it(`converts a server manifest with nested root group without layout`, () => {
  expect(getServerManifest(getRoutesFor(['./(root)/index.js']))).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(root)/index.js',
        page: '/(root)/index',
        namedRegex: '^(?:/\\(root\\))?(?:/)?$',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });
});
it(`converts a server manifest with nested root group and root layout`, () => {
  expect(getServerManifest(getRoutesFor(['./_layout.js', './(root)/index.js']))).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(root)/index.js',
        page: '/(root)/index',
        namedRegex: '^(?:/\\(root\\))?(?:/)?$',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });
});

describe(parseParameter, () => {
  it(`matches optionals using non-standard from router v1`, () => {
    expect(parseParameter('[...all]')).toEqual({
      name: 'all',
      optional: true,
      repeat: true,
    });
  });
});

it(`sorts deep paths before shallow paths`, () => {
  const a = getServerManifest(getRoutesFor(['./b/c.tsx', './a.tsx']));
  expect(a).toEqual(getServerManifest(getRoutesFor(['./a.tsx', './b/c.tsx'])));
  expect(a.htmlRoutes.map((r) => r.namedRegex)).toEqual(['^/a(?:/)?$', '^/b/c(?:/)?$']);
});
it(`sorts api routes after normal routes`, () => {
  const a = getServerManifest(getRoutesFor(['./api/[dynamic]+api.ts', './api/externals+api.ts']));
  expect(a.apiRoutes.map((r) => r.namedRegex)).toEqual([
    '^/api/externals(?:/)?$',
    '^/api/(?<dynamic>[^/]+?)(?:/)?$',
  ]);
  // const a = getServerManifest(getRoutesFor(['./[a]+api.tsx', './a+api.tsx']));
  // expect(a.map((r) => r.namedRegex)).toEqual(['^/a(?:/)?$', '^/(?<a>[^/]+?)(?:/)?$']);
});

it(`supports groups`, () => {
  expect(getServerManifest(getRoutesFor(['./(a)/b.tsx']))).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(a)/b.tsx',
        namedRegex: '^(?:/\\(a\\))?/b(?:/)?$',
        page: '/(a)/b',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });
});

it(`converts index routes`, () => {
  expect(
    getServerManifest(getRoutesFor(['./index.tsx', './a/index/b.tsx', './a/index/index.js']))
  ).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      { file: './index.tsx', namedRegex: '^/(?:/)?$', page: '/index', routeKeys: {} },
      {
        file: './a/index/b.tsx',
        namedRegex: '^/a/index/b(?:/)?$',
        page: '/a/index/b',
        routeKeys: {},
      },
      {
        file: './a/index/index.js',
        namedRegex: '^/a/index(?:/)?$',
        page: '/a/index/index',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });
});

function getNamedMatcher(fileName: string) {
  return new RegExp(getServerManifest(getRoutesFor([fileName])).htmlRoutes[0].namedRegex, '');
}

it(`matches expected`, () => {
  expect(getNamedMatcher('./index.tsx').test('/')).toBe(true);
  expect(getNamedMatcher('./post/[my_lil-id].tsx').exec('/post/123')?.groups).toEqual({
    my_lilid: '123',
  });
});

it(`matches expected with safe name`, () => {
  const matcher = getServerManifest(
    getRoutesFor(['./[user name]/category/[CATEGORY]/post/[my_lil-id].tsx'])
  ).htmlRoutes[0];

  const matched = new RegExp(matcher.namedRegex).exec(
    '/evanbacon/category/announcements/post/router-v3'
  );
  expect(matched?.groups).toEqual({
    CATEGORY: 'announcements',
    my_lilid: 'router-v3',
    username: 'evanbacon',
  });
  expect(matcher.routeKeys).toEqual({
    CATEGORY: 'CATEGORY',
    my_lilid: 'my_lil-id',
    username: 'user name',
  });
});

it(`matches expected with safe names that collide`, () => {
  const matcher = getServerManifest(
    getRoutesFor(['./[user name]/category/[my_lilid]/post/[my_lil-id].tsx'])
  ).htmlRoutes[0];

  const matched = new RegExp(matcher.namedRegex).exec(
    '/evanbacon/category/announcements/post/router-v3'
  );
  expect(matched?.groups).toEqual({
    a: 'router-v3',
    my_lilid: 'announcements',
    username: 'evanbacon',
  });
  expect(matcher.routeKeys).toEqual({
    a: 'my_lil-id',
    my_lilid: 'my_lilid',
    username: 'user name',
  });
});

// TODO: Maybe assert sooner?
it(`asserts duplicate keys eventually`, () => {
  const matcher = getServerManifest(getRoutesFor(['./[a]/b/[a].tsx']))[0];
  expect(() => new RegExp(matcher.namedRegex)).toThrowError();
});

it(`converts dynamic routes`, () => {
  expect(
    getServerManifest(getRoutesFor(['./[a].tsx', './[...b].tsx', './c/[d]/e/[...f].js']))
  ).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './c/[d]/e/[...f].js',
        namedRegex: '^/c/(?<d>[^/]+?)/e(?:/(?<f>.+?))?(?:/)?$',
        page: '/c/[d]/e/[...f]',
        routeKeys: { d: 'd', f: 'f' },
      },
      {
        file: './[a].tsx',
        namedRegex: '^/(?<a>[^/]+?)(?:/)?$',
        page: '/[a]',
        routeKeys: { a: 'a' },
      },
      {
        file: './[...b].tsx',
        namedRegex: '^(?:/(?<b>.+?))?(?:/)?$',
        page: '/[...b]',
        routeKeys: { b: 'b' },
      },
    ],
    notFoundRoutes: [],
  });
});

it(`converts dynamic routes on same level with specificity`, () => {
  const routesManifest = getServerManifest(
    getRoutesFor(['./index.tsx', './a.tsx', './[a].tsx', './[...a].tsx', './(a)/[a].tsx'])
  );
  expect(routesManifest).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './index.tsx',
        namedRegex: '^/(?:/)?$',
        page: '/index',
        routeKeys: {},
      },
      {
        file: './a.tsx',
        namedRegex: '^/a(?:/)?$',
        page: '/a',
        routeKeys: {},
      },
      {
        file: './(a)/[a].tsx',
        namedRegex: '^(?:/\\(a\\))?/(?<a>[^/]+?)(?:/)?$',
        page: '/(a)/[a]',
        routeKeys: { a: 'a' },
      },
      {
        file: './[a].tsx',
        namedRegex: '^/(?<a>[^/]+?)(?:/)?$',
        page: '/[a]',
        routeKeys: { a: 'a' },
      },
      {
        file: './[...a].tsx',
        namedRegex: '^(?:/(?<a>.+?))?(?:/)?$',
        page: '/[...a]',
        routeKeys: { a: 'a' },
      },
    ],
    notFoundRoutes: [],
  });

  for (const [matcher, page] of [
    ['/', './index.tsx'],
    ['/a', './a.tsx'],
    ['/b', './(a)/[a].tsx'],
  ]) {
    expect(
      routesManifest.htmlRoutes.find((r) => new RegExp(r.namedRegex).test(matcher))?.file
    ).toBe(page);
  }
});

it(`converts array syntax API routes`, () => {
  const routesFor = getRoutesFor(['./(a,b)/foo+api.tsx']);
  expect(routesFor).toEqual({
    children: [
      {
        children: [],
        contextKey: './(a,b)/foo+api.tsx',
        dynamic: null,
        loadRoute: expect.anything(),
        route: '(a)/foo',
        type: 'api',
      },
      {
        children: [],
        contextKey: './(a,b)/foo+api.tsx',
        dynamic: null,
        loadRoute: expect.anything(),
        route: '(b)/foo',
        type: 'api',
      },
    ],
    contextKey: 'expo-router/build/views/Navigator.js',
    dynamic: null,
    loadRoute: expect.anything(),
    generated: true,
    route: '',
    type: 'layout',
  });
  const routesManifest = getServerManifest(routesFor);
  expect(routesManifest).toEqual({
    apiRoutes: [
      // Should only be one API route entry.
      {
        file: './(a,b)/foo+api.tsx',
        namedRegex: '^(?:/\\((?:a|b)\\))?/foo(?:/)?$',
        routeKeys: {},
        // NOTE: This isn't correct, but page isn't used with API Routes.
        page: '/(b)/foo',
      },
    ],
    htmlRoutes: [],
    notFoundRoutes: [],
  });

  const match = (url: string) => {
    return routesManifest.apiRoutes.find((r) => new RegExp(r.namedRegex).test(url))?.file;
  };

  const matches = (url: string) => {
    expect(match(url)).toBe('./(a,b)/foo+api.tsx');
  };

  matches('/foo');
  matches('/(a)/foo');
  matches('/(b)/foo');

  // Cannot match the exact array syntax
  expect(match('/(a,b)/foo')).toBeUndefined();
  // No special variation
  expect(match('/(a,)/foo')).toBeUndefined();
  expect(match('/(a )/foo')).toBeUndefined();
  expect(match('/(, a )/foo')).toBeUndefined();
});

it(`converts array syntax HTML routes`, () => {
  const routesFor = getRoutesFor(['./(a,b)/foo.tsx']);
  expect(routesFor).toEqual({
    children: [
      {
        children: [],
        contextKey: './(a,b)/foo.tsx',
        entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/foo.tsx'],
        dynamic: null,
        loadRoute: expect.anything(),
        route: '(a)/foo',
        type: 'route',
      },
      {
        children: [],
        contextKey: './(a,b)/foo.tsx',
        entryPoints: ['expo-router/build/views/Navigator.js', './(a,b)/foo.tsx'],
        dynamic: null,
        loadRoute: expect.anything(),
        route: '(b)/foo',
        type: 'route',
      },
    ],
    contextKey: 'expo-router/build/views/Navigator.js',
    dynamic: null,
    loadRoute: expect.anything(),
    generated: true,
    route: '',
    type: 'layout',
  });
  const routesManifest = getServerManifest(routesFor);
  expect(routesManifest).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(a,b)/foo.tsx',
        namedRegex: '^(?:/\\(b\\))?/foo(?:/)?$',
        page: '/(b)/foo',
        routeKeys: {},
      },
      {
        file: './(a,b)/foo.tsx',
        namedRegex: '^(?:/\\(a\\))?/foo(?:/)?$',
        page: '/(a)/foo',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });

  const match = (url: string) => {
    return routesManifest.htmlRoutes.find((r) => new RegExp(r.namedRegex).test(url))?.file;
  };

  const matches = (url: string) => {
    expect(match(url)).toBe('./(a,b)/foo.tsx');
  };

  matches('/foo');
  matches('/(a)/foo');
  matches('/(b)/foo');

  // Cannot match the exact array syntax
  expect(match('/(a,b)/foo')).toBeUndefined();
  // No special variation
  expect(match('/(a,)/foo')).toBeUndefined();
  expect(match('/(a )/foo')).toBeUndefined();
  expect(match('/(, a )/foo')).toBeUndefined();
});

it(`converts top-level array syntax HTML routes`, () => {
  const routesManifest = getServerManifest(getRoutesFor(['./(a,b)/index.tsx']));
  expect(routesManifest).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(a,b)/index.tsx',
        namedRegex: '^(?:/\\(b\\))?(?:/)?$',
        page: '/(b)/index',
        routeKeys: {},
      },
      {
        file: './(a,b)/index.tsx',
        namedRegex: '^(?:/\\(a\\))?(?:/)?$',
        page: '/(a)/index',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });

  const match = (url: string) => {
    return routesManifest.htmlRoutes.find((r) => new RegExp(r.namedRegex).test(url))?.file;
  };

  expect(match('/')).toBeDefined();
  expect(match('/(a)')).toBeDefined();
  expect(match('/(a)/')).toBeDefined();
  expect(match('/(b)')).toBeDefined();
  //
  expect(match('/(a,b)')).toBeUndefined();
});

it(`converts nested array syntax HTML routes`, () => {
  const routesFor = getRoutesFor(['./(a,b)/(c, d)/foo.tsx']);
  const routesManifest = getServerManifest(routesFor);
  expect(routesManifest).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './(a,b)/(c, d)/foo.tsx',
        namedRegex: '^(?:/\\(b\\))?(?:/\\(d\\))?/foo(?:/)?$',
        page: '/(b)/(d)/foo',
        routeKeys: {},
      },
      {
        file: './(a,b)/(c, d)/foo.tsx',
        namedRegex: '^(?:/\\(b\\))?(?:/\\(c\\))?/foo(?:/)?$',
        page: '/(b)/(c)/foo',
        routeKeys: {},
      },
      {
        file: './(a,b)/(c, d)/foo.tsx',
        namedRegex: '^(?:/\\(a\\))?(?:/\\(d\\))?/foo(?:/)?$',
        page: '/(a)/(d)/foo',
        routeKeys: {},
      },
      {
        file: './(a,b)/(c, d)/foo.tsx',
        namedRegex: '^(?:/\\(a\\))?(?:/\\(c\\))?/foo(?:/)?$',
        page: '/(a)/(c)/foo',
        routeKeys: {},
      },
    ],
    notFoundRoutes: [],
  });

  const match = (url: string) => {
    return routesManifest.htmlRoutes.find((r) => new RegExp(r.namedRegex).test(url))?.file;
  };

  const matches = (url: string) => {
    expect(match(url)).toBe('./(a,b)/(c, d)/foo.tsx');
  };

  matches('/foo');
  matches('/(a)/foo');
  matches('/(b)/foo');
  matches('/(c)/foo');
  matches('/(d)/foo');
  matches('/(a)/(c)/foo');
  matches('/(b)/(d)/foo');

  // Cannot match the exact array syntax
  expect(match('/(a,b)/foo')).toBeUndefined();
  expect(match('/(a)/(b)/foo')).toBeUndefined();
  expect(match('/(a)/(c,d)/foo')).toBeUndefined();
  expect(match('/(c,d)/foo')).toBeUndefined();
  // No special variation
  expect(match('/(a,)/foo')).toBeUndefined();
  expect(match('/(a )/foo')).toBeUndefined();
  expect(match('/(, a )/foo')).toBeUndefined();
});

it(`matches top-level catch-all before +not-found route`, () => {
  const routesManifest = getServerManifest(getRoutesFor(['./[...a].tsx', './+not-found.tsx']));
  expect(routesManifest).toEqual({
    apiRoutes: [],
    htmlRoutes: [
      {
        file: './[...a].tsx',
        namedRegex: '^(?:/(?<a>.+?))?(?:/)?$',
        page: '/[...a]',
        routeKeys: { a: 'a' },
      },
    ],
    notFoundRoutes: [
      {
        file: './+not-found.tsx',
        namedRegex: '^(?:/(?<notfound>.+?))?(?:/)?$',
        page: '/+not-found',
        routeKeys: { notfound: 'not-found' },
      },
    ],
  });

  for (const [matcher, page] of [
    ['', './[...a].tsx'],
    ['/', './[...a].tsx'],
    ['//', './[...a].tsx'],
    ['/a', './[...a].tsx'],
    ['/b/c/', './[...a].tsx'],
  ]) {
    expect(routesManifest.htmlRoutes.find((r) => new RegExp(r.namedRegex).test(matcher)).file).toBe(
      page
    );
  }
});
