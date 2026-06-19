import { renderHook } from '@testing-library/react-native';

import type { ParamListBase, TabNavigationState } from '../../routers';
import { useStableTabOrder } from '../useStableTabOrder';

const makeState = ({
  routeNames,
  routesOrder,
  index = 0,
}: {
  routeNames: string[];
  routesOrder: string[];
  index?: number;
}): TabNavigationState<ParamListBase> => ({
  stale: false,
  key: 'tab',
  index,
  routeNames,
  routes: routesOrder.map((name) => ({ key: `${name}-key`, name })),
  preloadedRouteKeys: [],
});

test('returns routes in declaration order regardless of the routes (back-stack) order', () => {
  const state = makeState({ routeNames: ['a', 'b', 'c'], routesOrder: ['b', 'c', 'a'] });

  const { result } = renderHook(() => useStableTabOrder(state));

  expect(result.current.map((route) => route.name)).toEqual(['a', 'b', 'c']);
  // The route objects (and their keys) are the ones from `state.routes`.
  expect(result.current.map((route) => route.key)).toEqual(['a-key', 'b-key', 'c-key']);
});

test('reflects tabs being added and removed', () => {
  const { result, rerender } = renderHook(({ state }) => useStableTabOrder(state), {
    initialProps: { state: makeState({ routeNames: ['a', 'b'], routesOrder: ['b', 'a'] }) },
  });

  expect(result.current.map((route) => route.name)).toEqual(['a', 'b']);

  rerender({ state: makeState({ routeNames: ['a', 'b', 'c'], routesOrder: ['c', 'b', 'a'] }) });
  expect(result.current.map((route) => route.name)).toEqual(['a', 'b', 'c']);

  rerender({ state: makeState({ routeNames: ['a', 'c'], routesOrder: ['c', 'a'] }) });
  expect(result.current.map((route) => route.name)).toEqual(['a', 'c']);
});

test('drops declared names that have no matching route', () => {
  const state = makeState({ routeNames: ['a', 'b', 'c'], routesOrder: ['a', 'c'] }); // `b` not present in routes

  const { result } = renderHook(() => useStableTabOrder(state));

  expect(result.current.map((route) => route.name)).toEqual(['a', 'c']);
});

test('returns a stable reference while the state is unchanged', () => {
  const state = makeState({ routeNames: ['a', 'b'], routesOrder: ['b', 'a'] });

  const { result, rerender } = renderHook(() => useStableTabOrder(state));
  const first = result.current;

  rerender({});

  expect(result.current).toBe(first);
});
