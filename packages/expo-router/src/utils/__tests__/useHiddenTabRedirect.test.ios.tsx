import { renderHook } from '@testing-library/react-native';

import { router } from '../../imperative-api';
import { useIsFocused } from '../../react-navigation/native';
import { useBuildHref } from '../../standard-navigation/useBuildHref';
import {
  findRouteByName,
  isDeclaredInLayout,
  isHidden,
  useHiddenTabRedirect,
} from '../useHiddenTabRedirect';

jest.mock('../../react-navigation/native', () => {
  const actualNavigation = jest.requireActual(
    '../../react-navigation/native'
  ) as typeof import('../../react-navigation/native');
  return { ...actualNavigation, useIsFocused: jest.fn() };
});
jest.mock('../../standard-navigation/useBuildHref');

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

describe('isHidden', () => {
  it('returns true when hidden is true', () => {
    expect(isHidden({ options: { hidden: true } })).toBe(true);
  });

  it.each([
    undefined,
    {},
    { options: {} },
    { options: { hidden: false } },
    { options: { hidden: 1 } },
  ])('treats missing options and non-true hidden values as visible', (descriptor) => {
    expect(isHidden(descriptor)).toBeFalsy();
  });
});

describe('isDeclaredInLayout', () => {
  it('returns true for layout routes', () => {
    expect(isDeclaredInLayout({ routeSource: 'layout' })).toBe(true);
  });

  it.each([undefined, {}, { routeSource: 'filesystem' as const }])(
    'treats filesystem and missing descriptors as undeclared',
    (descriptor) => {
      expect(isDeclaredInLayout(descriptor)).toBe(false);
    }
  );
});

describe('findRouteByName', () => {
  it('finds an exact route name', () => {
    expect(findRouteByName(routes, 'home')).toBe(routes[0]);
  });

  it('matches a route without its trailing index segment', () => {
    expect(findRouteByName(routes, 'settings')).toBe(routes[1]);
  });

  it.each([undefined, 'missing'])('returns undefined when no route matches', (name) => {
    expect(findRouteByName(routes, name)).toBeUndefined();
  });
});

describe('useHiddenTabRedirect', () => {
  it('returns only visible layout routes and their focused index', () => {
    const { result } = renderHook(() =>
      useHiddenTabRedirect({
        routes,
        focusedRouteKey: 'settings-key',
        descriptors,
      })
    );

    expect(result.current).toEqual({
      visibleRoutes: [routes[0], routes[1]],
      visibleFocusedIndex: 1,
    });
  });

  it('returns -1 when the focused route is not visible', () => {
    const { result } = renderHook(() =>
      useHiddenTabRedirect({ routes, focusedRouteKey: 'hidden-key', descriptors })
    );

    expect(result.current.visibleFocusedIndex).toBe(-1);
  });

  it('redirects an unavailable focused route to the configured visible route', () => {
    renderHook(() =>
      useHiddenTabRedirect({
        routes,
        focusedRouteKey: 'hidden-key',
        descriptors,
        redirectToRouteName: 'settings',
      })
    );

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/href/settings/index');
  });

  it('builds the redirect href from the selected route', () => {
    renderHook(() =>
      useHiddenTabRedirect({
        routes,
        focusedRouteKey: 'hidden-key',
        descriptors,
        redirectToRouteName: 'settings',
      })
    );

    expect(buildHref).toHaveBeenCalledWith(routes[1]);
  });

  it('falls back to the first visible route when the configured route is unavailable', () => {
    renderHook(() =>
      useHiddenTabRedirect({
        routes,
        focusedRouteKey: 'hidden-key',
        descriptors,
        redirectToRouteName: 'missing',
      })
    );

    expect(replaceSpy).toHaveBeenCalledTimes(1);
    expect(replaceSpy).toHaveBeenCalledWith('/href/home');
  });

  it('does not redirect when the navigator is unfocused', () => {
    mockedUseIsFocused.mockReturnValue(false);

    renderHook(() => useHiddenTabRedirect({ routes, focusedRouteKey: 'hidden-key', descriptors }));

    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('does not redirect when the focused route is visible', () => {
    renderHook(() => useHiddenTabRedirect({ routes, focusedRouteKey: 'home-key', descriptors }));

    expect(buildHref).toHaveBeenCalledWith(routes[0]);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it('does not redirect when there are no visible routes', () => {
    renderHook(() =>
      useHiddenTabRedirect({
        routes: [routes[2]!],
        focusedRouteKey: 'hidden-key',
        descriptors,
      })
    );

    expect(replaceSpy).not.toHaveBeenCalled();
  });
});
