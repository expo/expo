import { renderHook } from '@testing-library/react-native';

import type { BackBehavior, ParamListBase, TabNavigationState } from '../routers';
import { usePreloadAnchor } from '../usePreloadAnchor';

const makeState = (
  routesPresent: string[],
  routeNames: string[]
): TabNavigationState<ParamListBase> => ({
  stale: false,
  key: 'tab',
  index: 0,
  routeNames,
  routes: routesPresent.map((name) => ({ key: `${name}-key`, name })),
});

function makeNavigation() {
  return { dispatch: jest.fn() };
}

const frontPreloadOf = (name: string) => ({ type: 'FRONT_PRELOAD', payload: { name } });

test('front-preloads the firstRoute anchor when it is absent', () => {
  const navigation = makeNavigation();
  const state = makeState(['feed'], ['index', 'feed']);

  renderHook(() => usePreloadAnchor(state, navigation, 'firstRoute', undefined));

  expect(navigation.dispatch).toHaveBeenCalledTimes(1);
  expect(navigation.dispatch).toHaveBeenCalledWith(frontPreloadOf('index'));
});

test('front-preloads the initialRoute anchor when it is absent', () => {
  const navigation = makeNavigation();
  const state = makeState(['feed'], ['index', 'settings', 'feed']);

  renderHook(() => usePreloadAnchor(state, navigation, 'initialRoute', 'settings'));

  expect(navigation.dispatch).toHaveBeenCalledTimes(1);
  expect(navigation.dispatch).toHaveBeenCalledWith(frontPreloadOf('settings'));
});

test('falls back to the first route for initialRoute without an initialRouteName', () => {
  const navigation = makeNavigation();
  const state = makeState(['feed'], ['index', 'feed']);

  // Matches `arrangeBackStack`, which anchors on the first present route in this config — so the
  // anchor must still be front-preloaded, otherwise back would bubble out.
  renderHook(() => usePreloadAnchor(state, navigation, 'initialRoute', undefined));

  expect(navigation.dispatch).toHaveBeenCalledTimes(1);
  expect(navigation.dispatch).toHaveBeenCalledWith(frontPreloadOf('index'));
});

test.each(['order', 'history', 'none'] as const)(
  'does not front-preload with backBehavior %s (no implicit anchor)',
  (backBehavior: BackBehavior) => {
    const navigation = makeNavigation();
    const state = makeState(['feed'], ['index', 'feed']);

    renderHook(() => usePreloadAnchor(state, navigation, backBehavior, undefined));

    expect(navigation.dispatch).not.toHaveBeenCalled();
  }
);

test('does not front-preload when the anchor is already present', () => {
  const navigation = makeNavigation();
  const state = makeState(['index', 'feed'], ['index', 'feed']);

  renderHook(() => usePreloadAnchor(state, navigation, 'firstRoute', undefined));

  expect(navigation.dispatch).not.toHaveBeenCalled();
});

test('re-dispatches a lost front-preload when the anchor stays absent (self-heal)', () => {
  const navigation = makeNavigation();
  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) =>
      usePreloadAnchor(s, navigation, 'firstRoute', undefined),
    { initialProps: { s: makeState(['feed'], ['index', 'feed']) } }
  );

  expect(navigation.dispatch).toHaveBeenCalledTimes(1);

  // A new state identity landed and the anchor is STILL absent: the dispatch was lost — dispatch
  // again. The FRONT_PRELOAD reducer no-ops once the anchor is present, so this converges.
  rerender({ s: makeState(['feed'], ['index', 'feed']) });
  expect(navigation.dispatch).toHaveBeenCalledTimes(2);
});

test('does not re-dispatch once the anchor is present', () => {
  const navigation = makeNavigation();
  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) =>
      usePreloadAnchor(s, navigation, 'firstRoute', undefined),
    { initialProps: { s: makeState(['feed'], ['index', 'feed']) } }
  );
  expect(navigation.dispatch).toHaveBeenCalledTimes(1);

  rerender({ s: makeState(['index', 'feed'], ['index', 'feed']) });
  expect(navigation.dispatch).toHaveBeenCalledTimes(1);
});
