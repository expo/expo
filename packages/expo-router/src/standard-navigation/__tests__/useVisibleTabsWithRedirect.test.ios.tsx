import { renderHook } from '@testing-library/react-native';

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

const mockedUseIsFocused = useIsFocused as jest.MockedFunction<typeof useIsFocused>;
const mockedUseBuildHref = useBuildHref as jest.MockedFunction<typeof useBuildHref>;

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
const isHidden = (options: { hidden?: boolean } | undefined) => options?.hidden === true;

let replaceSpy: jest.SpyInstance;
let buildHref: jest.Mock;

beforeEach(() => {
  buildHref = jest.fn((route) => `/href/${route.name}`);
  mockedUseBuildHref.mockReturnValue(buildHref);
  mockedUseIsFocused.mockReturnValue(true);
  replaceSpy = jest.spyOn(router, 'replace').mockImplementation(() => {});
});

afterEach(() => {
  replaceSpy.mockRestore();
});

describe('useVisibleTabsWithRedirect', () => {
  it('returns only visible layout routes and their focused index', () => {
    const { result } = renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        focusedRouteKey: 'settings-key',
        descriptors,
        isHidden,
      })
    );

    expect(result.current).toEqual({
      visibleRoutes: [routes[0], routes[1]],
      visibleFocusedIndex: 1,
    });
  });

  it('returns -1 when the focused route is not visible', () => {
    const { result } = renderHook(() =>
      useVisibleTabsWithRedirect({ routes, focusedRouteKey: 'hidden-key', descriptors, isHidden })
    );

    expect(result.current.visibleFocusedIndex).toBe(-1);
  });

  it('redirects an unavailable focused route to the configured visible route', () => {
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        focusedRouteKey: 'hidden-key',
        descriptors,
        redirectToRouteName: 'settings',
        isHidden,
      })
    );

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/href/settings/index');
  });

  it('builds the redirect href from the selected route', () => {
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        focusedRouteKey: 'hidden-key',
        descriptors,
        redirectToRouteName: 'settings',
        isHidden,
      })
    );

    expect(buildHref).toHaveBeenCalledWith(routes[1]);
  });

  it('falls back to the first visible route when the configured route is unavailable', () => {
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes,
        focusedRouteKey: 'hidden-key',
        descriptors,
        redirectToRouteName: 'missing',
        isHidden,
      })
    );

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/href/home');
  });

  it('does not redirect when the navigator is unfocused', () => {
    mockedUseIsFocused.mockReturnValue(false);

    renderHook(() =>
      useVisibleTabsWithRedirect({ routes, focusedRouteKey: 'hidden-key', descriptors, isHidden })
    );

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('does not redirect when the focused route is visible', () => {
    renderHook(() =>
      useVisibleTabsWithRedirect({ routes, focusedRouteKey: 'home-key', descriptors, isHidden })
    );

    expect(buildHref).toHaveBeenCalledWith(routes[0]);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('does not redirect when there are no visible routes', () => {
    renderHook(() =>
      useVisibleTabsWithRedirect({
        routes: [routes[2]!],
        focusedRouteKey: 'hidden-key',
        descriptors,
        isHidden,
      })
    );

    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
