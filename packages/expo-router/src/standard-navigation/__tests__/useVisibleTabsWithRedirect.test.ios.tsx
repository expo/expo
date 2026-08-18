import { renderHook } from '@testing-library/react-native';

import { useRouteNode } from '../../Route';
import { router } from '../../imperative-api';
import { useIsFocused } from '../../react-navigation/native';
import { useBuildHref } from '../useBuildHref';
import { useVisibleTabsWithRedirect } from '../useVisibleTabsWithRedirect';

jest.mock('../../react-navigation/native', () => {
  const actualNavigation = jest.requireActual(
    '../../react-navigation/native'
  ) as typeof import('../../react-navigation/native');
  return { ...actualNavigation, useIsFocused: jest.fn() };
});
jest.mock('../useBuildHref');
jest.mock('../../Route', () => ({
  ...jest.requireActual('../../Route'),
  useRouteNode: jest.fn(),
}));

const mockedUseIsFocused = useIsFocused as jest.MockedFunction<typeof useIsFocused>;
const mockedUseBuildHref = useBuildHref as jest.MockedFunction<typeof useBuildHref>;
const mockedUseRouteNode = useRouteNode as jest.MockedFunction<typeof useRouteNode>;

const routes = [
  { key: 'home-key', name: 'home' },
  { key: 'settings-key', name: 'settings/index' },
  { key: 'hidden-key', name: 'hidden' },
  { key: 'filesystem-key', name: 'filesystem' },
];
const descriptors = {
  'home-key': { routeSource: 'layout' as const },
  'settings-key': { routeSource: 'layout' as const },
  'hidden-key': { routeSource: 'layout' as const, options: { hidden: true } },
  'filesystem-key': { routeSource: 'filesystem' as const },
};
const routeNames = routes.map((route) => route.name);

function routeNode(initialRouteName: string) {
  // Only route names are relevant to this hook test fixture.
  return {
    initialRouteName,
    contextKey: './_layout.js',
    children: routes.map(({ name }) => ({ route: name })),
  } as ReturnType<typeof useRouteNode>;
}

let replaceSpy: jest.SpyInstance;
let warnSpy: jest.SpyInstance;
let buildHref: jest.Mock;

beforeEach(() => {
  buildHref = jest.fn((route) => `/href/${route.name}`);
  mockedUseBuildHref.mockReturnValue(buildHref);
  mockedUseIsFocused.mockReturnValue(true);
  // Prevent route data from leaking between tests.
  mockedUseRouteNode.mockReturnValue(null);
  replaceSpy = jest.spyOn(router, 'replace').mockImplementation(() => {});
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  replaceSpy.mockRestore();
  warnSpy.mockRestore();
});

describe('useVisibleTabsWithRedirect', () => {
  it('returns only visible layout routes and their focused index', () => {
    const { result } = renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'settings-key',
        descriptors,
      })
    );

    expect(result.current.visibleRoutes).toEqual([routes[0], routes[1]]);
    expect(result.current.focusedIndex).toBe(1);
  });

  it('does not focus another tab when the focused route is not visible', () => {
    const { result } = renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(result.current.focusedIndex).toBe(-1);
  });

  it('redirects an unavailable focused route to the configured visible route', () => {
    mockedUseRouteNode.mockReturnValue(routeNode('settings'));
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/href/settings/index');
  });

  it('builds the redirect href from the selected route', () => {
    mockedUseRouteNode.mockReturnValue(routeNode('settings'));
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(buildHref).toHaveBeenCalledWith(routes[1]);
  });

  it('throws when the configured route is unavailable', () => {
    mockedUseRouteNode.mockReturnValue(routeNode('missing'));
    expect(() =>
      renderHook(() =>
        useVisibleTabsWithRedirect({
          routes,
          routeNames,
          focusedRouteKey: 'hidden-key',
          descriptors,
        })
      )
    ).toThrow(
      'The initial route name "missing" was not found in the layout at "./_layout.js". Available routes are: "home", "settings/index", "hidden", "filesystem". Set `unstable_settings.initialRouteName` to the name of a route in this layout.'
    );
  });

  it('redirects when a navigator with no visible focused route becomes focused', () => {
    mockedUseIsFocused.mockReturnValue(false);

    const { result, rerender } = renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(result.current.focusedIndex).toBe(-1);
    expect(replaceSpy).not.toHaveBeenCalled();

    mockedUseIsFocused.mockReturnValue(true);
    rerender({});

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/href/home');
  });

  it('does not redirect when the focused route is visible', () => {
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames,
        focusedRouteKey: 'home-key',
        descriptors,
      })
    );

    expect(buildHref).toHaveBeenCalledWith(routes[0]);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('does not redirect when there are no visible routes', () => {
    mockedUseRouteNode.mockReturnValue({ contextKey: './app/_layout.tsx' } as ReturnType<
      typeof useRouteNode
    >);
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes: [routes[3]!],
        routeNames: ['filesystem'],
        focusedRouteKey: 'filesystem-key',
        descriptors,
      })
    );

    expect(replaceSpy).not.toHaveBeenCalled();
    expect(warnSpy.mock.calls).toMatchSnapshot();
  });

  it('orders visible routes and redirect fallback by route names', () => {
    const { result } = renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        routeNames: ['settings/index', 'home', 'hidden', 'filesystem'],
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(result.current.visibleRoutes).toEqual([routes[1], routes[0]]);
    expect(replaceSpy).toHaveBeenCalledWith('/href/settings/index');
  });
});
