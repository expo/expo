import { renderHook } from '@testing-library/react-native';
import { type ReactNode } from 'react';

import { getRouteInfoFromState } from '../../global-state/getRouteInfoFromState';
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

// --- Unit: useBuildHref in isolation. getRouteInfoFromState is mocked so only the addState nesting
// and the return plumbing are exercised; the real route-info pipeline is covered by integration. ---
jest.mock('../../global-state/getRouteInfoFromState');
const mockedGetRouteInfoFromState = getRouteInfoFromState as jest.MockedFunction<
  typeof getRouteInfoFromState
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
    mockedGetRouteInfoFromState.mockReturnValue({ pathnameWithParams: '/resolved' } as ReturnType<
      typeof getRouteInfoFromState
    >);
  });

  it('returns the pathnameWithParams from getRouteInfoFromState', () => {
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

    expect(mockedGetRouteInfoFromState).toHaveBeenCalledWith({
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

    expect(mockedGetRouteInfoFromState).toHaveBeenCalledWith({
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

  it('grafts the route as the sole state when there is no focused state', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState(undefined),
    });

    expect(result.current(route('feed', { q: '1' }))).toBe('/resolved');
    expect(mockedGetRouteInfoFromState).toHaveBeenCalledWith({
      routes: [{ name: 'feed', params: { q: '1' } }],
    });
  });

  it('caches the href per route object', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState({ routes: [{ name: '__root' }] }),
    });
    const feed = route('feed', { q: '1' });

    expect(result.current(feed)).toBe('/resolved');
    expect(result.current(feed)).toBe('/resolved');

    expect(mockedGetRouteInfoFromState).toHaveBeenCalledTimes(1);
  });

  it('computes each route object separately', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState({ routes: [{ name: '__root' }] }),
    });

    result.current(route('feed'));
    result.current(route('profile'));

    expect(mockedGetRouteInfoFromState).toHaveBeenCalledTimes(2);
  });

  it('recomputes when a route object is replaced with new params', () => {
    const { result } = renderHook(() => useBuildHref(), {
      wrapper: withFocusedState({ routes: [{ name: '__root' }] }),
    });

    // Routers replace the route object on param changes, so a params update arrives
    // as a new object identity.
    result.current(route('feed', { q: '1' }));
    result.current(route('feed', { q: '2' }));

    expect(mockedGetRouteInfoFromState).toHaveBeenCalledTimes(2);
  });

  it('resets the cache when the focused state changes', () => {
    let providedState: FocusedRouteState | undefined = { routes: [{ name: '__root' }] };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NavigationFocusedRouteStateContext.Provider value={providedState}>
        {children}
      </NavigationFocusedRouteStateContext.Provider>
    );
    const { result, rerender } = renderHook(() => useBuildHref(), { wrapper });
    const feed = route('feed');

    result.current(feed);
    expect(mockedGetRouteInfoFromState).toHaveBeenCalledTimes(1);

    providedState = { routes: [{ name: '__root', state: { routes: [{ name: 'group' }] } }] };
    rerender(undefined);

    result.current(feed);
    expect(mockedGetRouteInfoFromState).toHaveBeenCalledTimes(2);
  });

  // useStandardState depends on the buildHref identity in its useMemo deps, so the identity
  // must be stable across unrelated rerenders and change exactly when the focused state changes.
  it('keeps the buildHref identity stable until the focused state changes', () => {
    let providedState: FocusedRouteState | undefined = { routes: [{ name: '__root' }] };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <NavigationFocusedRouteStateContext.Provider value={providedState}>
        {children}
      </NavigationFocusedRouteStateContext.Provider>
    );
    const { result, rerender } = renderHook(() => useBuildHref(), { wrapper });
    const first = result.current;

    rerender(undefined);
    expect(result.current).toBe(first);

    providedState = { routes: [{ name: '__root', state: { routes: [{ name: 'group' }] } }] };
    rerender(undefined);
    expect(result.current).not.toBe(first);
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
