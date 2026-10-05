import type { RouteNode } from '../Route';
import { findRouteNodeAndParamsForState, sortRoutes, sortRoutesWithInitial } from '../Route';
import { generateDynamic } from '../getRoutes';
import { getLayoutAnchor } from '../layoutAnchor';

const asRouteNode = (route: string): RouteNode => {
  return {
    type: 'route',
    children: [],
    dynamic: generateDynamic(route),
    loadRoute(): any {
      return {
        default() {
          return null;
        },
      };
    },
    route,
    contextKey: 'INVALID_TEST_VALUE',
  };
};

function getSortedRoutes(...routes: string[]) {
  return routes
    .map(asRouteNode)
    .sort(sortRoutes)
    .map((node) => node.route);
}

describe(sortRoutes, () => {
  it(`sorts not found routes by priority`, () => {
    expect(getSortedRoutes('[slug]', '[...slug]', '+not-found')).toEqual([
      '[slug]',
      '[...slug]',
      '+not-found',
    ]);
    expect(getSortedRoutes('index', '[a]', 'beta', '+not-found', '[...a]')).toEqual([
      'index',
      'beta',
      '[a]',
      '[...a]',
      '+not-found',
    ]);
  });
  it(`sorts index routes by priority`, () => {
    // Index before deep dynamic
    expect(sortRoutes(asRouteNode('index'), asRouteNode('[...a]'))).toBe(-1);
    // Index before dynamic
    expect(sortRoutes(asRouteNode('index'), asRouteNode('[a]'))).toBe(-1);
    // Index before named
    expect(sortRoutes(asRouteNode('index'), asRouteNode('a'))).toBe(-1);
    expect(sortRoutes(asRouteNode('index'), asRouteNode('z'))).toBe(-1);

    // Index tied with group
    expect(sortRoutes(asRouteNode('index'), asRouteNode('(z)'))).toBe(2);
  });
  it(`sorts group routes by priority`, () => {
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('[...a]'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('[a]'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('a'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('z'))).toBe(-1);
    expect(sortRoutes(asRouteNode('(zzz)'), asRouteNode('index'))).toBe(0);
  });
  it(`sorts multiple dynamic routes higher than a single deep dynamic route`, () => {
    // dynamic before deep dynamic
    expect(sortRoutes(asRouteNode('[a]/[b]'), asRouteNode('[...a]'))).toBe(-1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('[a]/[b]'))).toBe(1);
  });

  it(`sorts dynamic routes by priority`, () => {
    // dynamic before deep dynamic
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('[...a]'))).toBe(-1);
    // tied with two dynamic routes
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('[b]'))).toBe(0);
    expect(sortRoutes(asRouteNode('[a]/[b]'), asRouteNode('[b]/[a]'))).toBe(0);
    // Lower priority
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('index'))).toBe(1);
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('a'))).toBe(1);
    expect(sortRoutes(asRouteNode('[a]'), asRouteNode('(a)'))).toBe(1);
  });
  it(`sorts deep dynamic routes by priority`, () => {
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('[...beta]'))).toBe(0);
    expect(sortRoutes(asRouteNode('[...a]/[b]'), asRouteNode('[...beta]/[c]'))).toBe(0);
    // Lower priority
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('[b]'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]/[a]'), asRouteNode('[b]/[c]'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('index'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('a'))).toBe(1);
    expect(sortRoutes(asRouteNode('[...a]'), asRouteNode('(a)'))).toBe(1);
  });
});

const asLayoutNode = (anchor: string, children: string[]): RouteNode => ({
  ...asRouteNode('_layout'),
  type: 'layout',
  loadRoute: () => ({ default: () => null, unstable_settings: { anchor } }),
  children: children.map(asRouteNode),
});

describe(getLayoutAnchor, () => {
  it('returns the registered route name for a valid setting', () => {
    expect(getLayoutAnchor(asLayoutNode('a', ['a']))).toBe('a');
  });

  it('resolves a directory setting to its registered index route', () => {
    expect(getLayoutAnchor(asLayoutNode('a', ['a/index']))).toBe('a/index');
  });

  it('sorts a resolved directory setting before other routes', () => {
    const node = asLayoutNode('a', ['b', 'a/index']);

    expect(
      node.children.sort(sortRoutesWithInitial(getLayoutAnchor(node))).map(({ route }) => route)
    ).toEqual(['a/index', 'b']);
  });

  it('throws for a missing route', () => {
    const node = asLayoutNode('missing', ['index', 'settings/index']);
    node.contextKey = './app/(tabs)/_layout.tsx';

    expect(() => getLayoutAnchor(node)).toThrow(
      'The initial route name "missing" was not found in the layout at "./app/(tabs)/_layout.tsx". Available routes are: "index", "settings/index". Set `unstable_settings.anchor` to the name of a route in this layout.'
    );
  });

  it('returns undefined without a route node', () => {
    expect(getLayoutAnchor(null)).toBeUndefined();
  });

  it('throws when the layout module has not loaded yet', () => {
    const node = asLayoutNode('a', ['a']);
    // `loadRoute` is typed as sync, but Metro's async require returns a promise until the chunk loads.
    node.loadRoute = () => Promise.resolve({}) as never;

    expect(() => getLayoutAnchor(node)).toThrow('was read before its module finished loading');
  });
});

describe(findRouteNodeAndParamsForState, () => {
  it('returns no route node without nested state', () => {
    expect(findRouteNodeAndParamsForState(asRouteNode('_layout'), undefined)).toEqual({
      routeNode: undefined,
      params: {},
    });
  });
});
