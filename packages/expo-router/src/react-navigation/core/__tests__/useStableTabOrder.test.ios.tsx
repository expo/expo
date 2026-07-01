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
});

test('returns routes in declaration order regardless of the routes (back-stack) order', () => {
  const state = makeState({ routeNames: ['a', 'b', 'c'], routesOrder: ['b', 'c', 'a'] });

  const { result } = renderHook(() => useStableTabOrder(state.routeNames, state.routes));

  expect(result.current.map((route) => route.name)).toEqual(['a', 'b', 'c']);
  // The route objects (and their keys) are the ones from `routes`.
  expect(result.current.map((route) => route.key)).toEqual(['a-key', 'b-key', 'c-key']);
});

test('reflects tabs being added and removed', () => {
  const { result, rerender } = renderHook(
    ({ state }: { state: TabNavigationState<ParamListBase> }) =>
      useStableTabOrder(state.routeNames, state.routes),
    {
      initialProps: { state: makeState({ routeNames: ['a', 'b'], routesOrder: ['b', 'a'] }) },
    }
  );

  expect(result.current.map((route) => route.name)).toEqual(['a', 'b']);

  rerender({ state: makeState({ routeNames: ['a', 'b', 'c'], routesOrder: ['c', 'b', 'a'] }) });
  expect(result.current.map((route) => route.name)).toEqual(['a', 'b', 'c']);

  rerender({ state: makeState({ routeNames: ['a', 'c'], routesOrder: ['c', 'a'] }) });
  expect(result.current.map((route) => route.name)).toEqual(['a', 'c']);
});

test('drops declared names that have no matching route', () => {
  const state = makeState({ routeNames: ['a', 'b', 'c'], routesOrder: ['a', 'c'] }); // `b` not present in routes

  const { result } = renderHook(() => useStableTabOrder(state.routeNames, state.routes));

  expect(result.current.map((route) => route.name)).toEqual(['a', 'c']);
});

test('orders an arbitrary names list and routes that need not come from the same state', () => {
  // Native tabs pass `routesOrderNames` plus a `[...lazyRoutes, ...presentRoutes]` array; the
  // names drive the order even when the routes arrive in an unrelated order.
  const routes = [
    { key: 'c-key', name: 'c' },
    { key: 'a-key', name: 'a' },
    { key: 'b-key', name: 'b' },
  ];

  const { result } = renderHook(() => useStableTabOrder(['a', 'b', 'c'], routes));

  expect(result.current.map((route) => route.key)).toEqual(['a-key', 'b-key', 'c-key']);
});

test('returns a stable reference while the inputs are unchanged', () => {
  const state = makeState({ routeNames: ['a', 'b'], routesOrder: ['b', 'a'] });

  const { result, rerender } = renderHook(() =>
    useStableTabOrder(state.routeNames, state.routes)
  );
  const first = result.current;

  rerender({});

  expect(result.current).toBe(first);
});
