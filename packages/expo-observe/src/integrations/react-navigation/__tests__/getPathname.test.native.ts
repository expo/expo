import { getPathname } from '../getPathname';
import type { NavigationRouteLike, NavigationStateLike } from '../types';

type RouteSpec = {
  name: string;
  params?: object;
  state?: NavigationStateLike;
};

function state(
  type: 'stack' | 'tab',
  routes: RouteSpec[],
  index = routes.length - 1
): NavigationStateLike {
  const navRoutes: NavigationRouteLike[] = routes.map((route, i) => ({
    key: `${route.name}-${i}`,
    name: route.name,
    params: route.params,
    state: route.state,
  }));
  return {
    type,
    index,
    key: `${type}-key`,
    routeNames: routes.map((route) => route.name),
    stale: false,
    routes: navRoutes,
  } as NavigationStateLike;
}

describe('getPathname', () => {
  it('returns undefined for an undefined state', () => {
    expect(getPathname(undefined)).toBeUndefined();
  });

  it('returns undefined for a state with no routes', () => {
    expect(getPathname(state('stack', []))).toBeUndefined();
  });

  it('resolves a flat single-screen state to its route name', () => {
    expect(getPathname(state('stack', [{ name: 'Home' }]))).toBe('/Home');
  });

  it('uses the focused route within a stack', () => {
    expect(getPathname(state('stack', [{ name: 'Home' }, { name: 'Details' }]))).toBe('/Details');
  });

  it('joins the focused route names of nested navigators', () => {
    const nested = state('stack', [
      {
        name: 'Group',
        state: state('stack', [{ name: 'Home' }, { name: 'Details' }]),
      },
    ]);
    expect(getPathname(nested)).toBe('/Group/Details');
  });

  it('follows non-zero indexes at every level of deep nesting', () => {
    const deep = state('stack', [
      { name: 'Other' },
      {
        name: 'Tabs',
        state: state(
          'tab',
          [
            { name: 'Home' },
            {
              name: 'Sessions',
              state: state('stack', [{ name: 'List' }, { name: 'Details' }], 1),
            },
          ],
          1
        ),
      },
    ]);
    expect(getPathname(deep)).toBe('/Tabs/Sessions/Details');
  });

  it('returns undefined when the index points past the routes array', () => {
    const outOfBounds = { ...state('stack', [{ name: 'Home' }]), index: 5 };
    expect(getPathname(outOfBounds)).toBeUndefined();
  });

  it('does not serialize route params into the pathname', () => {
    expect(getPathname(state('stack', [{ name: 'Details', params: { id: '42' } }]))).toBe(
      '/Details'
    );
  });

  it('picks the focused tab when given a tab navigator state', () => {
    expect(getPathname(state('tab', [{ name: 'Home' }, { name: 'Profile' }], 1))).toBe('/Profile');
  });

  it('walks a useStateForPath subtree where index is undefined at every level', () => {
    // `useStateForPath` returns a minimal chain to the current screen: each
    // level holds a single route and omits `index`.
    const subtree = {
      routes: [
        {
          key: 'Group-0',
          name: 'Group',
          state: { routes: [{ key: 'Details-0', name: 'Details' }] },
        },
      ],
    } as unknown as NavigationStateLike;
    expect(getPathname(subtree)).toBe('/Group/Details');
  });
});
