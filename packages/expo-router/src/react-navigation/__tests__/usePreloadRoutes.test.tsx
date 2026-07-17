import { renderHook } from '@testing-library/react-native';

import { getPreloadAction } from '../../global-state/getNavigationAction';
import type { ParamListBase, TabNavigationState } from '../routers';
import { usePreloadRoutes } from '../usePreloadRoutes';

jest.mock('../../global-state/getNavigationAction', () => ({
  getPreloadAction: jest.fn(),
}));

const mockGetPreloadAction = getPreloadAction as jest.MockedFunction<typeof getPreloadAction>;

beforeEach(() => {
  mockGetPreloadAction.mockReset();
});

const makeState = (routesPresent: string[], routeNames: string[]): TabNavigationState<ParamListBase> => ({
  stale: false,
  key: 'tab',
  index: 0,
  routeNames,
  routes: routesPresent.map((name) => ({ key: `${name}-key`, name })),
});

function makeNavigation() {
  return { preload: jest.fn(), dispatch: jest.fn() };
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

test('re-dispatches a lost preload when the state commits without it (self-heal)', () => {
  const navigation = makeNavigation();
  // The dispatched preload was clobbered by another commit (e.g. `getStateForRouteNamesChange`
  // repairing a seeded tab level), so `a` is still absent in the NEW state object.
  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) => usePreloadRoutes(s, navigation, ['a']),
    {
      initialProps: { s: makeState(['home'], ['home', 'a']) },
    }
  );

  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // A new state identity landed and `a` is STILL absent: the dispatch was lost — dispatch again.
  // The tab PRELOAD reducer is by-name idempotent, so a duplicate converges instead of duplicating.
  rerender({ s: makeState(['home'], ['home', 'a']) });
  expect(navigation.preload).toHaveBeenCalledTimes(2);
});

test('does NOT re-preload while the route stays present', () => {
  const navigation = makeNavigation();

  const { rerender } = renderHook(
    ({ s }: { s: TabNavigationState<ParamListBase> }) => usePreloadRoutes(s, navigation, ['a']),
    {
      initialProps: { s: makeState(['home'], ['home', 'a']) },
    }
  );
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // `a` is now present, so no new preload.
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

  // `a` materializes -> present, no new dispatch.
  rerender({ s: makeState(['home', 'a'], ['home', 'a']) });
  expect(navigation.preload).toHaveBeenCalledTimes(1);

  // `a` is removed (hidden tab) -> absent again, so it must be re-preloaded.
  rerender({ s: makeState(['home'], ['home', 'a']) });
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

test('compiles a subtree-carrying PRELOAD targeted at the calling navigator when an href resolves', () => {
  const navigation = makeNavigation();
  const state = makeState(['home'], ['home', 'a', 'b']);
  const action = {
    type: 'PRELOAD' as const,
    payload: { name: 'a', params: undefined },
  };
  mockGetPreloadAction.mockReturnValue(action);

  const resolveHref = (name: string) => `/${name}`;
  renderHook(() => usePreloadRoutes(state, navigation, ['a'], resolveHref));

  expect(mockGetPreloadAction).toHaveBeenCalledWith('tab', '/a', 'a', false);
  expect(navigation.dispatch).toHaveBeenCalledWith(action);
  expect(navigation.preload).not.toHaveBeenCalled();
});

test('falls back to a bare preload when the href does not resolve', () => {
  const navigation = makeNavigation();
  const state = makeState(['home'], ['home', 'a']);

  renderHook(() => usePreloadRoutes(state, navigation, ['a'], () => undefined));

  expect(navigation.preload).toHaveBeenCalledWith('a');
  expect(mockGetPreloadAction).not.toHaveBeenCalled();
  expect(navigation.dispatch).not.toHaveBeenCalled();
});

test('skips a route whose compiled action is undefined (redirect already handled)', () => {
  const navigation = makeNavigation();
  const state = makeState(['home'], ['home', 'a']);
  mockGetPreloadAction.mockReturnValue(undefined);

  renderHook(() => usePreloadRoutes(state, navigation, ['a'], (name) => `/${name}`));

  expect(mockGetPreloadAction).toHaveBeenCalled();
  expect(navigation.dispatch).not.toHaveBeenCalled();
  expect(navigation.preload).not.toHaveBeenCalled();
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

  // The new name is dispatched; the still-absent `a` is re-dispatched too (self-heal — the
  // by-name idempotent reducer converges duplicates).
  rerender({ s: makeState(['home'], ['home', 'a', 'b']), names: ['a', 'b'] });
  expect(navigation.preload).toHaveBeenCalledTimes(3);
  expect(navigation.preload).toHaveBeenCalledWith('b');
});
