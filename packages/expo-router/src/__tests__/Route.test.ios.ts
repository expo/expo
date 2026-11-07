import type { LayoutRouteNode, RouteNode, PageRouteNode } from '../Route';
import { sortRoutes, sortRoutesWithInitial } from '../Route';
import { generateDynamic } from '../getRoutes';
import { findRouteNodeAndParamsForState, getValidInitialRouteName } from '../routeNode';

const asPageRouteNode = (route: string): PageRouteNode => {
  return {
    type: 'route',
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
    .map(asPageRouteNode)
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
    expect(sortRoutes(asPageRouteNode('index'), asPageRouteNode('[...a]'))).toBe(-1);
    // Index before dynamic
    expect(sortRoutes(asPageRouteNode('index'), asPageRouteNode('[a]'))).toBe(-1);
    // Index before named
    expect(sortRoutes(asPageRouteNode('index'), asPageRouteNode('a'))).toBe(-1);
    expect(sortRoutes(asPageRouteNode('index'), asPageRouteNode('z'))).toBe(-1);

    // Index tied with group
    expect(sortRoutes(asPageRouteNode('index'), asPageRouteNode('(z)'))).toBe(2);
  });
  it(`sorts group routes by priority`, () => {
    expect(sortRoutes(asPageRouteNode('(zzz)'), asPageRouteNode('[...a]'))).toBe(-1);
    expect(sortRoutes(asPageRouteNode('(zzz)'), asPageRouteNode('[a]'))).toBe(-1);
    expect(sortRoutes(asPageRouteNode('(zzz)'), asPageRouteNode('a'))).toBe(-1);
    expect(sortRoutes(asPageRouteNode('(zzz)'), asPageRouteNode('z'))).toBe(-1);
    expect(sortRoutes(asPageRouteNode('(zzz)'), asPageRouteNode('index'))).toBe(0);
  });
  it(`sorts multiple dynamic routes higher than a single deep dynamic route`, () => {
    // dynamic before deep dynamic
    expect(sortRoutes(asPageRouteNode('[a]/[b]'), asPageRouteNode('[...a]'))).toBe(-1);
    expect(sortRoutes(asPageRouteNode('[...a]'), asPageRouteNode('[a]/[b]'))).toBe(1);
  });

  it(`sorts dynamic routes by priority`, () => {
    // dynamic before deep dynamic
    expect(sortRoutes(asPageRouteNode('[a]'), asPageRouteNode('[...a]'))).toBe(-1);
    // tied with two dynamic routes
    expect(sortRoutes(asPageRouteNode('[a]'), asPageRouteNode('[b]'))).toBe(0);
    expect(sortRoutes(asPageRouteNode('[a]/[b]'), asPageRouteNode('[b]/[a]'))).toBe(0);
    // Lower priority
    expect(sortRoutes(asPageRouteNode('[a]'), asPageRouteNode('index'))).toBe(1);
    expect(sortRoutes(asPageRouteNode('[a]'), asPageRouteNode('a'))).toBe(1);
    expect(sortRoutes(asPageRouteNode('[a]'), asPageRouteNode('(a)'))).toBe(1);
  });
  it(`sorts deep dynamic routes by priority`, () => {
    expect(sortRoutes(asPageRouteNode('[...a]'), asPageRouteNode('[...beta]'))).toBe(0);
    expect(sortRoutes(asPageRouteNode('[...a]/[b]'), asPageRouteNode('[...beta]/[c]'))).toBe(0);
    // Lower priority
    expect(sortRoutes(asPageRouteNode('[...a]'), asPageRouteNode('[b]'))).toBe(1);
    expect(sortRoutes(asPageRouteNode('[...a]/[a]'), asPageRouteNode('[b]/[c]'))).toBe(1);
    expect(sortRoutes(asPageRouteNode('[...a]'), asPageRouteNode('index'))).toBe(1);
    expect(sortRoutes(asPageRouteNode('[...a]'), asPageRouteNode('a'))).toBe(1);
    expect(sortRoutes(asPageRouteNode('[...a]'), asPageRouteNode('(a)'))).toBe(1);
  });
});

const asLayoutNode = (anchor: string, children: RouteNode[] = []): LayoutRouteNode => ({
  ...asPageRouteNode('_layout'),
  type: 'layout',
  loadRoute: () => ({ unstable_settings: { anchor } }),
  children,
});

describe(getValidInitialRouteName, () => {
  it('returns the registered route name for a valid setting', () => {
    const node = asLayoutNode('a', [asPageRouteNode('a')]);

    expect(getValidInitialRouteName(node)).toBe('a');
  });

  it('resolves a directory setting to its registered index route', () => {
    const node = asLayoutNode('a', [asPageRouteNode('a/index')]);

    expect(getValidInitialRouteName(node)).toBe('a/index');
  });

  it('sorts a resolved directory setting before other routes', () => {
    const node = asLayoutNode('a', [asPageRouteNode('b'), asPageRouteNode('a/index')]);

    expect(
      node.children
        .sort(sortRoutesWithInitial(getValidInitialRouteName(node)))
        .map(({ route }) => route)
    ).toEqual(['a/index', 'b']);
  });

  it('throws for a missing route', () => {
    const node = asLayoutNode('missing', [
      asPageRouteNode('index'),
      asPageRouteNode('settings/index'),
    ]);
    node.contextKey = './app/(tabs)/_layout.tsx';

    expect(() => getValidInitialRouteName(node)).toThrow(
      'The initial route name "missing" was not found in the layout at "./app/(tabs)/_layout.tsx". Available routes are: "index", "settings/index". Set `unstable_settings.anchor` to the name of a route in this layout.'
    );
  });

  it('returns undefined without a route node', () => {
    expect(getValidInitialRouteName(null)).toBeUndefined();
  });
});

describe(findRouteNodeAndParamsForState, () => {
  it('returns no route node without nested state', () => {
    expect(findRouteNodeAndParamsForState(asLayoutNode('_layout'), undefined)).toEqual({
      routeNode: undefined,
      params: {},
    });
  });
});
