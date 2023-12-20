import { RouteNode } from '../Route';
import { getRoutes as old_getRoutes } from '../getRoutes';
import { Options, getRoutes as new_getRoutes } from '../global-state/getRoutes';
import { getMockContext } from '../testing-library';

/**
 * There are some cosmetic differences between the old and new getRoutes.
 * Mostly with the order of the children routes, this simply normalizes them
 *
 * We also remove loadRoute as its difficult to compare
 */
function normalizeRoutes(route: RouteNode | null) {
  if (!route) return;

  delete (route as any)['loadRoute'];

  route.children.sort((a, b) => {
    return a.contextKey.localeCompare(b.contextKey);
  });

  for (const child of route.children) {
    normalizeRoutes(child);
  }

  return route;
}

function expectNewToEqualOld(contextArg: Parameters<typeof getMockContext>[0], options?: Options) {
  const context = getMockContext(contextArg);
  const oldRouteNode = normalizeRoutes(old_getRoutes(context, options));
  const newRouteNode = normalizeRoutes(new_getRoutes(context, options));

  expect(newRouteNode).toEqual(oldRouteNode);
}

function expectNewToThrowSameErrorOld(...args: Parameters<typeof getMockContext>) {
  const context = getMockContext(...args);

  try {
    old_getRoutes(context);
    throw new Error('Critical error: old getRoutes did not throw');
  } catch (error) {
    expect(() => new_getRoutes(context)).toThrowError(error);
  }
}

function getTreeForKeys(keys: string[]) {
  return Object.fromEntries(keys.map((key) => [key, () => null]));
}

it('invalid routes', () => {
  return expectNewToEqualOld({});
});

it('invalid routes (api only)', () => {
  return expectNewToEqualOld(getTreeForKeys(['test+api']));
});

it('invalid routes (not found only)', () => {
  return expectNewToEqualOld(getTreeForKeys(['+not-found']));
});

it('invalid routes (_layout only)', () => {
  return expectNewToEqualOld(getTreeForKeys(['_layout']));
});

it('skips +html files', () => {
  return expectNewToEqualOld({
    _layout: () => null,
    '+html': () => null,
    one: () => null,
  });
});

it('basic routes', () => {
  return expectNewToEqualOld({
    // top level routes
    index: () => null,
    one: () => null,
    // nested routes
    '1/apple': () => null,

    // nested routes with layout
    '2/_layout': () => null,
    '2/apple': () => null,

    // deeply nested routes with layout
    '2/banana/_layout': () => null,
    '2/banana/banana': () => null,
  });
});

it('dynamic routes', () => {
  return expectNewToEqualOld({
    // top level routes
    index: () => null,
    one: () => null,

    // dynamic routes with layout
    '1/[fruit]/_layout': () => null,
    '1/[fruit]/page': () => null,

    // nested routes with nested layout and dynamic routes
    '1/[fruit]/[...vegetable]/_layout': () => null,
    '1/[fruit]/[...vegetable]/page': () => null,
  });
});

it('custom +not-found', () => {
  return expectNewToEqualOld({
    // top level routes
    index: () => null,
    '+not-found': () => null,
    '1/+not-found': () => null,
    '1/[fruit]/+not-found': () => null,
    '1/[fruit]/[...vegetable]/+not-found': () => null,
  });
});

it('api routes', () => {
  return expectNewToEqualOld({
    // top level routes
    index: () => null,
    'test+api': () => null,
    '2/test+api': () => null,
  });
});

describe('duplicate routes', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('throws if there are duplicate routes (shallow)', () => {
    expectNewToThrowSameErrorOld({
      'a.js': () => null,
      'a.tsx': () => null,
    });
  });

  it('throws if there are duplicate routes (nested)', () => {
    expectNewToThrowSameErrorOld({
      '1/2/3/a.js': () => null,
      '1/2/3/a.tsx': () => null,
    });
  });

  it('does not throw if there are duplicate routes in production', () => {
    process.env.NODE_ENV = 'production';
    expectNewToEqualOld({
      'a.js': () => null,
      'a.tsx': () => null,
    });
  });
});

it('should assert using deprecated layout route format', () => {
  expectNewToThrowSameErrorOld({
    '(app)': () => null,
    '(app)/index': () => null,
  });
});

it(`should return a layout route`, () => {
  expectNewToEqualOld(getTreeForKeys(['(app)/_layout', '(app)/index']));
});

it(`should return a layout route using alternative format`, () => {
  expectNewToEqualOld(getTreeForKeys(['(app)/_layout', '(app)/index']));
});

it(`should match top-level not found files`, () => {
  expectNewToEqualOld(
    getTreeForKeys(['./+not-found.tsx', './(group)/+not-found.tsx', './(group)/(2)/+not-found.tsx'])
  );
});

it(`should not match top-level deep dynamic with nested index`, () => {
  expectNewToEqualOld(
    getTreeForKeys([
      // This has been removed, as its invalid in v3
      // './(group)/+not-found/(group).tsx',
      './(group)/+not-found/(group)/index.tsx',
      './+not-found/index.tsx',
      './+not-found/(group)/index.tsx',
      './(group1)/+not-found/(group2)/index.tsx',
      './(group1)/+not-found/(group2)/(group3)/index.tsx',
    ])
  );
});

it(`automatically blocks +html file`, () => {
  expectNewToEqualOld(getTreeForKeys(['./+html.js', './other/+html.js', './_layout.tsx']));
});

it(`should allow skipping entry point logic`, () => {
  expectNewToEqualOld(getTreeForKeys(['./some/nested/value.tsx']), {
    ignoreEntryPoints: true,
  });
});

it(`should allow a custom root _layout route`, () => {
  expectNewToEqualOld(getTreeForKeys(['./_layout.tsx']));
});

it(`should support a single nested route without layouts`, () => {
  expectNewToEqualOld(getTreeForKeys(['./some/nested/value.tsx']));
});

it(`get dynamic routes`, () => {
  expectNewToEqualOld(getTreeForKeys(['./[dynamic].tsx', './[...deep].tsx']));
});

it(`should convert a complex context module routes`, () => {
  expectNewToEqualOld(
    getTreeForKeys([
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
      './some/nested/value.tsx',
    ])
  );
});

it(`should convert an empty context module to routes`, () => {
  expectNewToEqualOld(getTreeForKeys([]));
});
