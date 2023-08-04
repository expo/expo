import { getMatchableManifest } from '../getMatchableManifest';
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
    createMockContextModule(Object.fromEntries(files.map((file) => [file, { default() {} }])))
  )!;
}

it(`converts single basic`, () => {
  expect(getMatchableManifest(getRoutesFor(['./home.js']))).toEqual([
    { groups: {}, namedRegex: '^/home(?:/)?$', re: /^\/home(?:\/)?$/, routeKeys: {} },
  ]);
});

it(`sorts`, () => {
  const a = getMatchableManifest(getRoutesFor(['./b/c.tsx', './a.tsx']));
  expect(a).toEqual(getMatchableManifest(getRoutesFor(['./a.tsx', './b/c.tsx'])));
  expect(a.map((r) => r.namedRegex)).toEqual(['^/b/c(?:/)?$', '^/a(?:/)?$']);
});

it(`supports groups`, () => {
  expect(getMatchableManifest(getRoutesFor(['./(a)/b.tsx']))).toEqual([
    {
      groups: {},
      namedRegex: '^(?:/\\(a\\))?/b(?:/)?$',
      re: /^(?:\/\(a\))?\/b(?:\/)?$/,
      routeKeys: {},
    },
  ]);
});

it(`converts index routes`, () => {
  expect(
    getMatchableManifest(getRoutesFor(['./index.tsx', './a/index/b.tsx', './a/index/index.js']))
  ).toEqual([
    { groups: {}, namedRegex: '^/a/index(?:/)?$', re: /^\/a\/index(?:\/)?$/, routeKeys: {} },
    { groups: {}, namedRegex: '^/a/index/b(?:/)?$', re: /^\/a\/index\/b(?:\/)?$/, routeKeys: {} },
    { groups: {}, namedRegex: '^/(?:/)?$', re: /^\/(?:\/)?$/, routeKeys: {} },
  ]);
});

function getNamedMatcher(fileName: string) {
  return new RegExp(getMatchableManifest(getRoutesFor([fileName]))[0].namedRegex, '');
}

it(`matches expected`, () => {
  expect(getNamedMatcher('./index.tsx').test('/')).toBe(true);
  console.log(getNamedMatcher('./post/[my_lil-id].tsx'));
  expect(getNamedMatcher('./post/[my_lil-id].tsx').exec('/post/123')?.groups).toEqual({
    my_lilid: '123',
  });
});

it(`matches expected with safe name`, () => {
  const matcher = getMatchableManifest(
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
  const matcher = getMatchableManifest(
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
  const matcher = getMatchableManifest(getRoutesFor(['./[a]/b/[a].tsx']))[0];
  expect(() => new RegExp(matcher.namedRegex)).toThrowError();
});

it(`converts dynamic routes`, () => {
  expect(
    getMatchableManifest(getRoutesFor(['./[a].tsx', './[...b].tsx', './c/[d]/e/[...f].js']))
  ).toEqual([
    {
      groups: { b: { optional: false, pos: 1, repeat: true } },
      namedRegex: '^/(?<b>.+?)(?:/)?$',
      re: /^\/(.+?)(?:\/)?$/,
      routeKeys: { b: 'b' },
    },
    {
      groups: { a: { optional: false, pos: 1, repeat: false } },
      namedRegex: '^/(?<a>[^/]+?)(?:/)?$',
      re: /^\/([^/]+?)(?:\/)?$/,
      routeKeys: { a: 'a' },
    },
    {
      groups: {
        d: { optional: false, pos: 1, repeat: false },
        f: { optional: false, pos: 2, repeat: true },
      },
      namedRegex: '^/c/(?<d>[^/]+?)/e/(?<f>.+?)(?:/)?$',
      re: /^\/c\/([^/]+?)\/e\/(.+?)(?:\/)?$/,
      routeKeys: { d: 'd', f: 'f' },
    },
  ]);
});
