import { getExactRoutes } from '../getRoutes';
import { getServerManifest } from '../getServerManifest';
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
        page: './b+api',
      }),
    ],
    htmlRoutes: [
      expect.objectContaining({
        page: './a',
      }),
    ],
    notFoundRoutes: [
      expect.objectContaining({
        page: './c/+not-found',
      }),
      expect.objectContaining({
        page: './+not-found',
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
        page: './api/[post]+api',
        routeKeys: { post: 'post' },
      },
    ],
    htmlRoutes: [{ file: './home.js', namedRegex: '^/home(?:/)?$', page: './home', routeKeys: {} }],
    notFoundRoutes: [],
  });
});

xit(`converts single basic`, () => {
  expect(getServerManifest(getRoutesFor(['./home.js']))).toEqual([
    { namedRegex: '^/home(?:/)?$', routeKeys: {} },
  ]);
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
        page: './(a)/b',
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
      { file: './index.tsx', namedRegex: '^/(?:/)?$', page: './index', routeKeys: {} },
      {
        file: './a/index/b.tsx',
        namedRegex: '^/a/index/b(?:/)?$',
        page: './a/index/b',
        routeKeys: {},
      },
      {
        file: './a/index/index.js',
        namedRegex: '^/a/index(?:/)?$',
        page: './a/index/index',
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
        namedRegex: '^/c/(?<d>[^/]+?)/e/(?<f>.+?)(?:/)?$',
        page: './c/[d]/e/[...f]',
        routeKeys: { d: 'd', f: 'f' },
      },
      {
        file: './[a].tsx',
        namedRegex: '^/(?<a>[^/]+?)(?:/)?$',
        page: './[a]',
        routeKeys: { a: 'a' },
      },
      {
        file: './[...b].tsx',
        namedRegex: '^/(?<b>.+?)(?:/)?$',
        page: './[...b]',
        routeKeys: { b: 'b' },
      },
    ],
    notFoundRoutes: [],
  });
});
