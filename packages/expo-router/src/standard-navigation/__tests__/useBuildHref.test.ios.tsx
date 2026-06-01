import { renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';

import { getCachedRouteInfo } from '../../global-state/routeInfoCache';
import type { NavigationRoute, ParamListBase } from '../../react-navigation/core';
import {
  NavigationFocusedRouteStateContext,
  type FocusedRouteState,
} from '../../react-navigation/core/NavigationFocusedRouteStateContext';
import { useBuildHref } from '../useBuildHref';

type Route = NavigationRoute<ParamListBase, string>;

function route(name: string, params?: object): Route {
  return { key: `${name}-1`, name, params } as Route;
}

// --- Unit: useBuildHref in isolation. getCachedRouteInfo is mocked so only the addState nesting
// and the return plumbing are exercised; the real route-info pipeline is covered by integration. ---
jest.mock('../../global-state/routeInfoCache');
const mockedGetCachedRouteInfo = getCachedRouteInfo as jest.MockedFunction<
  typeof getCachedRouteInfo
>;

function withFocusedState(currentState: FocusedRouteState | undefined) {
  return ({ children }: { children: ReactNode }) => (
    <NavigationFocusedRouteStateContext.Provider value={currentState}>
      {children}
    </NavigationFocusedRouteStateContext.Provider>
  );
}

describe('useBuildHref (unit)', () => {
  beforeEach(() => {
    mockedGetCachedRouteInfo.mockReturnValue({ pathnameWithParams: '/resolved' } as ReturnType<
      typeof getCachedRouteInfo
    >);
  });

  it('returns the pathnameWithParams from getCachedRouteInfo', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState({
        routes: [{ name: '__root', state: { routes: [{ name: 'group' }] } }],
      }),
    });

    expect(result.current(route('feed'))).toBe('/resolved');
  });

  it('grafts the route as the deepest focused route', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState({
        routes: [{ name: '__root', state: { routes: [{ name: 'group' }] } }],
      }),
    });

    result.current(route('feed', { q: '1' }));

    expect(mockedGetCachedRouteInfo).toHaveBeenCalledWith({
      routes: [
        {
          name: '__root',
          state: {
            routes: [{ name: 'group', state: { routes: [{ name: 'feed', params: { q: '1' } }] } }],
          },
        },
      ],
    });
  });

  it('grafts under multi-level focused state', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState({
        routes: [
          {
            name: '__root',
            state: { routes: [{ name: 'group', state: { routes: [{ name: 'nested' }] } }] },
          },
        ],
      }),
    });

    result.current(route('leaf'));

    expect(mockedGetCachedRouteInfo).toHaveBeenCalledWith({
      routes: [
        {
          name: '__root',
          state: {
            routes: [
              {
                name: 'group',
                state: { routes: [{ name: 'nested', state: { routes: [{ name: 'leaf' }] } }] },
              },
            ],
          },
        },
      ],
    });
  });

  it('does not mutate the current focused state or the input route params', () => {
    const currentState: FocusedRouteState = {
      routes: [
        { name: '__root', state: { routes: [{ name: 'group', params: { team: 'acme' } }] } },
      ],
    };
    const snapshot = JSON.parse(JSON.stringify(currentState));
    const params = { sort: 'asc' };
    const input = route('feed', params);

    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState(currentState),
    });
    result.current(input);

    expect(currentState).toEqual(snapshot);
    expect(input.params).toBe(params);
  });
});
