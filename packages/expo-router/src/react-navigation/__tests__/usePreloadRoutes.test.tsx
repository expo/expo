import { renderHook } from '@testing-library/react-native';

import type { ParamListBase, TabNavigationState } from '../routers';
import { usePreloadRoutes } from '../usePreloadRoutes';

const makeState = (routesPresent: string[], routeNames: string[]): TabNavigationState<ParamListBase> => ({
  stale: false,
  key: 'tab',
  index: 0,
  routeNames,
  routes: routesPresent.map((name) => ({ key: `${name}-key`, name })),
});

function makeNavigation() {
  return { preload: jest.fn() };
}

test('preloads only the absent routes from the policy list', () => {
  const navigation = makeNavigation();
  const state = makeState(['home'], ['home', 'a', 'b']);

  renderHook(() => usePreloadRoutes(state, navigation, ['a', 'b']));

  expect(navigation.preload).toHaveBeenCalledTimes(2);
  expect(navigation.preload).toHaveBeenCalledWith('a');
  expect(navigation.preload).toHaveBeenCalledWith('b');
});

test('never preloads a route that is already present', () => {
  const navigation = makeNavigation();
  const state = makeState(['home', 'a'], ['home', 'a', 'b']);

  renderHook(() => usePreloadRoutes(state, navigation, ['a', 'b']));

  expect(navigation.preload).toHaveBeenCalledTimes(1);
  expect(navigation.preload).toHaveBeenCalledWith('b');
});

test('dedups while a preload is pending (route still absent)', () => {
  const navigation = makeNavigation();
  // The dispatched preload hasn't landed in state yet (async), so `a` is still absent on rerender.
  const state = makeState(['home'], ['home', 'a']);

  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) => usePreloadRoutes(s, navigation, ['a']),
    {
      initialProps: { s: state },
    }
  );

  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // Re-render with the SAME (still-absent) state: must not dispatch again.
  rerender({ s: makeState(['home'], ['home', 'a']) });
  expect(navigation.preload).toHaveBeenCalledTimes(1);
});

test('clears the pending mark once the route appears, and does NOT re-preload while it stays present', () => {
  const navigation = makeNavigation();

  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) => usePreloadRoutes(s, navigation, ['a']),
    {
      initialProps: { s: makeState(['home'], ['home', 'a']) },
    }
  );
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // `a` is now present -> pending mark clears, but it is present so no new preload.
  rerender({ s: makeState(['home', 'a'], ['home', 'a']) });
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // Still present on a later render -> still no new preload.
  rerender({ s: makeState(['home', 'a'], ['home', 'a']) });
  expect(navigation.preload).toHaveBeenCalledTimes(1);
});

test('re-preloads after a route is removed then requested again (the key bug)', () => {
  const navigation = makeNavigation();

  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) => usePreloadRoutes(s, navigation, ['a']),
    {
      initialProps: { s: makeState(['home'], ['home', 'a']) },
    }
  );
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // `a` materializes -> pending clears.
  rerender({ s: makeState(['home', 'a'], ['home', 'a']) });
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // `a` is removed (hidden tab) -> absent again and no longer pending.
  rerender({ s: makeState(['home'], ['home', 'a']) });
  // Must re-preload because the pending mark was cleared when it became present.
  expect(navigation.preload).toHaveBeenCalledTimes(2);
});

test('does not re-dispatch on an unrelated re-render (same state.routes / navigation / list identity)', () => {
  const navigation = makeNavigation();
  // Stable identities across renders: same state object, same policy-list reference.
  const state = makeState(['home'], ['home', 'a']);
  const names = ['a'];

  const { rerender } = renderHook(
    ({ s, n }: { s: TabNavigationState<ParamListBase>; n: string[] }) =>
      usePreloadRoutes(s, navigation, n),
    { initialProps: { s: state, n: names } }
  );
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // Re-render with identical references: the effect must not run again.
  rerender({ s: state, n: names });
  expect(navigation.preload).toHaveBeenCalledTimes(1);
});

test('reacts to a name being added to the policy list later', () => {
  const navigation = makeNavigation();

  const { rerender } = renderHook(
    ({ s, names }: { s: TabNavigationState<ParamListBase>; names: string[] }) =>
      usePreloadRoutes(s, navigation, names),
    {
      initialProps: { s: makeState(['home'], ['home', 'a', 'b']), names: ['a'] },
    }
  );
  expect(navigation.preload).toHaveBeenCalledTimes(1);
  expect(navigation.preload).toHaveBeenCalledWith('a');

  rerender({ s: makeState(['home'], ['home', 'a', 'b']), names: ['a', 'b'] });
  expect(navigation.preload).toHaveBeenCalledTimes(2);
  expect(navigation.preload).toHaveBeenCalledWith('b');
});
