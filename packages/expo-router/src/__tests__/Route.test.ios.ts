import type { RouteNode } from '../Route';
import {
  findRouteNodeByName,
  findRouteNodeForState,
  getValidInitialRouteName,
  sortRoutes,
  sortRoutesWithInitial,
} from '../Route';
import { generateDynamic } from '../getRoutes';

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

describe(getValidInitialRouteName, () => {
  it('returns the registered route name for a valid setting', () => {
    const node = asRouteNode('_layout');
    node.initialRouteName = 'a';
    node.children = [asRouteNode('a')];

    expect(getValidInitialRouteName(node)).toBe('a');
  });

  it('resolves a directory setting to its registered index route', () => {
    const node = asRouteNode('_layout');
    node.initialRouteName = 'a';
    node.children = [asRouteNode('a/index')];

    expect(getValidInitialRouteName(node)).toBe('a/index');
  });

  it('sorts a resolved directory setting before other routes', () => {
    const node = asRouteNode('_layout');
    node.initialRouteName = 'a';
    node.children = [asRouteNode('b'), asRouteNode('a/index')];

    expect(
      node.children
        .sort(sortRoutesWithInitial(getValidInitialRouteName(node)))
        .map(({ route }) => route)
    ).toEqual(['a/index', 'b']);
  });

  it('throws for a missing route', () => {
    const node = asRouteNode('_layout');
    node.initialRouteName = 'missing';
    node.contextKey = './app/(tabs)/_layout.tsx';
    node.children = [asRouteNode('index'), asRouteNode('settings/index')];

    expect(() => getValidInitialRouteName(node)).toThrow(
      'The initial route name "missing" was not found in the layout at "./app/(tabs)/_layout.tsx". Available routes are: "index", "settings/index". Set `unstable_settings.initialRouteName` to the name of a route in this layout.'
    );
  });

  it('returns undefined without a route node', () => {
    expect(getValidInitialRouteName(null)).toBeUndefined();
  });
});

describe(findRouteNodeForState, () => {
  it('walks the focused state path with exact route names', () => {
    const root = asRouteNode('_layout');
    const settings = asRouteNode('settings');
    settings.children = [asRouteNode('index'), asRouteNode('details')];
    root.children = [asRouteNode('settings/index'), settings];

    const route = {
      name: 'settings',
      state: { index: 1, routes: [{ name: 'index' }, { name: 'details' }] },
    };

    expect(findRouteNodeByName(root, route.name)).toBe(settings);
    expect(findRouteNodeForState(root, route)?.route).toBe('details');
  });

  it('does not use the directory index fallback for state routes', () => {
    const root = asRouteNode('_layout');
    root.children = [asRouteNode('settings/index')];

    expect(findRouteNodeByName(root, 'settings')).toBeUndefined();
  });

  it('returns undefined when a nested route is missing', () => {
    const root = asRouteNode('_layout');
    const settings = asRouteNode('settings');
    settings.children = [asRouteNode('index')];
    root.children = [settings];

    expect(
      findRouteNodeForState(root, {
        name: 'settings',
        state: { routes: [{ name: 'missing' }] },
      })
    ).toBeUndefined();
  });
});
