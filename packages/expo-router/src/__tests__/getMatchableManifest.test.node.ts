import { getMatchableManifest } from '../getMatchableManifest';
import { getExactRoutes, getRoutes } from '../getRoutes';
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

xit(`converts single basic`, () => {
  expect(getMatchableManifest(getRoutesFor(['./home.js']))).toEqual([
    { groups: {}, namedRegex: '^/home(?:/)?$', re: /^\/home(?:\/)?$/, routeKeys: {} },
  ]);
});

xit(`sorts`, () => {
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
