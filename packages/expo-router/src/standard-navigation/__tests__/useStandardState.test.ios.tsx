import { renderHook } from '@testing-library/react-native';

import type { NavigationRoute, NavigationState, ParamListBase } from '../../react-navigation/core';
import { useBuildHref } from '../useBuildHref';
import { useStandardState } from '../useStandardState';

// Unit: useStandardState in isolation. useBuildHref is mocked so only the hook's own mapping and
// memoization logic is exercised; the real href pipeline is covered by the integration test.
jest.mock('../useBuildHref');

const mockedUseBuildHref = useBuildHref as jest.MockedFunction<typeof useBuildHref>;
type BuildHref = ReturnType<typeof useBuildHref>;

function makeBuilderState(
  routes: { key: string; name: string; params?: object }[],
  index = 0
): NavigationState {
  return {
    key: 'builder',
    index,
    routeNames: routes.map((r) => r.name),
    routes,
    type: 'tab',
    stale: false,
    preloadedRouteKeys: [],
  } as unknown as NavigationState;
}

const byName: BuildHref = (route: NavigationRoute<ParamListBase, string>) => `/href/${route.name}`;

beforeEach(() => {
  mockedUseBuildHref.mockReturnValue(byName);
});

describe('useStandardState', () => {
  it('maps index and each route to { href, key, name, params }', () => {
    const builderState = makeBuilderState(
      [
        { key: 'feed-1', name: 'feed', params: { tab: 'a' } },
        { key: 'profile-1', name: 'profile' },
      ],
      1
    );

    const { result } = renderHook(() => useStandardState(builderState));

    expect(result.current).toEqual({
      index: 1,
      routes: [
        { href: '/href/feed', key: 'feed-1', name: 'feed', params: { tab: 'a' } },
        { href: '/href/profile', key: 'profile-1', name: 'profile', params: undefined },
      ],
    });
  });

  it('handles an empty route list', () => {
    const { result } = renderHook(() => useStandardState(makeBuilderState([], 0)));

    expect(result.current).toEqual({ index: 0, routes: [] });
  });

  it('builds the href via buildHref once per route', () => {
    const buildHref = jest.fn(byName);
    mockedUseBuildHref.mockReturnValue(buildHref);

    renderHook(() =>
      useStandardState(
        makeBuilderState([
          { key: 'feed-1', name: 'feed' },
          { key: 'profile-1', name: 'profile' },
        ])
      )
    );

    expect(buildHref).toHaveBeenCalledTimes(2);
    expect(buildHref).toHaveBeenCalledWith(expect.objectContaining({ name: 'feed' }));
    expect(buildHref).toHaveBeenCalledWith(expect.objectContaining({ name: 'profile' }));
  });

  it('returns a stable reference when neither builderState nor buildHref change', () => {
    const builderState = makeBuilderState([{ key: 'feed-1', name: 'feed' }]);

    const { result, rerender } = renderHook(() => useStandardState(builderState));
    const first = result.current;

    rerender({});

    expect(result.current).toBe(first);
  });

  it('recomputes when builderState reference changes', () => {
    const { result, rerender } = renderHook(
      ({ s }: { s: NavigationState }) => useStandardState(s),
      {
        initialProps: { s: makeBuilderState([{ key: 'feed-1', name: 'feed' }]) },
      }
    );
    const first = result.current;

    rerender({ s: makeBuilderState([{ key: 'feed-1', name: 'feed' }]) });

    expect(result.current).not.toBe(first);
  });

  it('recomputes when buildHref identity changes even if builderState is stable', () => {
    const builderState = makeBuilderState([{ key: 'feed-1', name: 'feed' }]);
    mockedUseBuildHref.mockReturnValue((route) => `/v1/${route.name}`);

    const { result, rerender } = renderHook(() => useStandardState(builderState));
    const first = result.current;

    mockedUseBuildHref.mockReturnValue((route) => `/v2/${route.name}`);
    rerender({});

    expect(result.current).not.toBe(first);
    expect(result.current.routes[0]!.href).toBe('/v2/feed');
  });
});
