import type {
  NavigationRoute,
  NavigationState,
  NavigatorScreenParams,
  ParamListBase,
} from '@react-navigation/native';

import { createGetPathname } from '../getPathname';

type FlatParamList = {
  Home: undefined;
  Details: { id?: string } | undefined;
  Profile: undefined;
  Unknown: undefined;
};

type NestedParamList = {
  Group: NavigatorScreenParams<{
    Home: undefined;
    Details: undefined;
  }>;
};

type RouteSpec = {
  name: string;
  params?: object;
  state?: NavigationState;
};

function state(
  type: 'stack' | 'tab',
  routes: RouteSpec[],
  index = routes.length - 1
): NavigationState {
  const navRoutes: NavigationRoute<ParamListBase, string>[] = routes.map((route, i) => ({
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
  };
}

describe('createGetPathname', () => {
  it('returns undefined for every input when no linking.config is provided', () => {
    const getPathname = createGetPathname(undefined);
    expect(getPathname(undefined)).toBeUndefined();
    expect(getPathname(state('stack', [{ name: 'Home' }]))).toBeUndefined();
  });

  it('returns undefined when linking is provided but config is missing', () => {
    const getPathname = createGetPathname<FlatParamList>({ prefixes: [] });
    expect(getPathname(state('stack', [{ name: 'Home' }]))).toBeUndefined();
  });

  it('returns undefined for an undefined state even when config is present', () => {
    const getPathname = createGetPathname<FlatParamList>({
      prefixes: [],
      config: { screens: { Home: 'home' } },
    });
    expect(getPathname(undefined)).toBeUndefined();
  });

  it('resolves a flat single-screen state to its configured path', () => {
    const getPathname = createGetPathname<FlatParamList>({
      prefixes: [],
      config: { screens: { Home: 'home' } },
    });
    expect(getPathname(state('stack', [{ name: 'Home' }]))).toBe('/home');
  });

  it('uses the focused route within a stack to pick the path', () => {
    const getPathname = createGetPathname<FlatParamList>({
      prefixes: [],
      config: { screens: { Home: 'home', Details: 'details' } },
    });
    expect(getPathname(state('stack', [{ name: 'Home' }, { name: 'Details' }]))).toBe('/details');
  });

  it('descends into nested navigators and joins configured paths', () => {
    const getPathname = createGetPathname<NestedParamList>({
      prefixes: [],
      config: {
        screens: {
          Group: {
            path: 'group',
            screens: { Home: 'home', Details: 'details' },
          },
        },
      },
    });
    const nested = state('stack', [
      {
        name: 'Group',
        state: state('stack', [{ name: 'Home' }, { name: 'Details' }]),
      },
    ]);
    expect(getPathname(nested)).toBe('/group/details');
  });

  it('still resolves a path when given the inner-navigator subtree (as useStateForPath returns)', () => {
    // useStateForPath returns the state subtree rooted at the focused
    // screen's path. `getPathFromState` walks routes downward, so the inner
    // navigator's path segments still resolve against the same config.
    const getPathname = createGetPathname<NestedParamList>({
      prefixes: [],
      config: {
        screens: {
          Group: {
            path: 'group',
            screens: { Home: 'home', Details: 'details' },
          },
        },
      },
    });
    const subtree = state('stack', [
      {
        name: 'Group',
        state: state('stack', [{ name: 'Home' }, { name: 'Details' }]),
      },
    ]);
    expect(getPathname(subtree)).toBe('/group/details');
  });

  it('serializes route params into the pathname when the config declares them', () => {
    const getPathname = createGetPathname<FlatParamList>({
      prefixes: [],
      config: {
        screens: { Details: { path: 'details/:id' } },
      },
    });
    expect(getPathname(state('stack', [{ name: 'Details', params: { id: '42' } }]))).toBe(
      '/details/42'
    );
  });

  it('uses the route name as a fallback path when the screen is not in the config', () => {
    const getPathname = createGetPathname<FlatParamList>({
      prefixes: [],
      config: { screens: { Home: 'home' } },
    });
    expect(getPathname(state('stack', [{ name: 'Unknown' }]))).toBe('/Unknown');
  });

  it('picks the focused tab when given a tab navigator state', () => {
    const getPathname = createGetPathname<FlatParamList>({
      prefixes: [],
      config: { screens: { Home: 'home', Profile: 'profile' } },
    });
    expect(getPathname(state('tab', [{ name: 'Home' }, { name: 'Profile' }], 1))).toBe('/profile');
  });
});
