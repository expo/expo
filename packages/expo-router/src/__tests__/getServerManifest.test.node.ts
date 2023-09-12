import { getServerManifest } from '../getServerManifest';
import { getExactRoutes } from '../getRoutes';
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

it(`converts a server manifest`, () => {
  expect(getServerManifest(getRoutesFor(['./home.js', './api/[post]+api.tsx']))).toEqual({
    apiRoutes: [
      {
        namedRegex: '^/api/(?<post>[^/]+?)(?:/)?$',
        routeKeys: { post: 'post' },
      },
    ],
    staticRoutes: [{ namedRegex: '^/home(?:/)?$', routeKeys: {} }],
  });
});

xit(`converts single basic`, () => {
  expect(getServerManifest(getRoutesFor(['./home.js']))).toEqual([
    { namedRegex: '^/home(?:/)?$', routeKeys: {} },
  ]);
});

it(`sorts`, () => {
  const a = getServerManifest(getRoutesFor(['./b/c.tsx', './a.tsx']));
  expect(a).toEqual(getServerManifest(getRoutesFor(['./a.tsx', './b/c.tsx'])));
  expect(a.map((r) => r.namedRegex)).toEqual(['^/b/c(?:/)?$', '^/a(?:/)?$']);
});
it(`sorts dynamic routes after normal routes`, () => {
  const a = getServerManifest(getRoutesFor(['./api/[dynamic]+api.ts', './api/externals+api.ts']));
  expect(a.map((r) => r.namedRegex)).toEqual(['^/a(?:/)?$', '^/(?<a>[^/]+?)(?:/)?$']);
  // const a = getServerManifest(getRoutesFor(['./[a]+api.tsx', './a+api.tsx']));
  // expect(a.map((r) => r.namedRegex)).toEqual(['^/a(?:/)?$', '^/(?<a>[^/]+?)(?:/)?$']);
});

it(`supports groups`, () => {
  expect(getServerManifest(getRoutesFor(['./(a)/b.tsx']))).toEqual([
    {
      namedRegex: '^(?:/\\(a\\))?/b(?:/)?$',
      routeKeys: {},
    },
  ]);
});

it(`converts index routes`, () => {
  expect(
    getServerManifest(getRoutesFor(['./index.tsx', './a/index/b.tsx', './a/index/index.js']))
  ).toEqual([
    { namedRegex: '^/a/index(?:/)?$', routeKeys: {} },
    { namedRegex: '^/a/index/b(?:/)?$', routeKeys: {} },
    { namedRegex: '^/(?:/)?$', routeKeys: {} },
  ]);
});

function getNamedMatcher(fileName: string) {
  return new RegExp(getServerManifest(getRoutesFor([fileName]))[0].namedRegex, '');
}

it(`matches expected`, () => {
  expect(getNamedMatcher('./index.tsx').test('/')).toBe(true);
  console.log(getNamedMatcher('./post/[my_lil-id].tsx'));
  expect(getNamedMatcher('./post/[my_lil-id].tsx').exec('/post/123')?.groups).toEqual({
    my_lilid: '123',
  });
});

it(`matches expected with safe name`, () => {
  const matcher = getServerManifest(
    getRoutesFor(['./[user name]/category/[CATEGORY]/post/[my_lil-id].tsx'])
  )[0];

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
  )[0];
  console.log('matcher', matcher);

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
  ).toEqual([
    {
      namedRegex: '^/(?<b>.+?)(?:/)?$',
      routeKeys: { b: 'b' },
    },
    {
      namedRegex: '^/(?<a>[^/]+?)(?:/)?$',
      routeKeys: { a: 'a' },
    },
    {
      namedRegex: '^/c/(?<d>[^/]+?)/e/(?<f>.+?)(?:/)?$',
      routeKeys: { d: 'd', f: 'f' },
    },
  ]);
});
