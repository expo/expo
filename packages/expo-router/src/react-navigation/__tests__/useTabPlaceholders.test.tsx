import { renderHook } from '@testing-library/react-native';

import { getRouteKey } from '../routers/getRouteKey';
import type { ParamListBase, TabNavigationState } from '../routers';
import { useTabPlaceholders } from '../useTabPlaceholders';

// The tab navigator's own state key; both real and placeholder route keys derive from it.
const STATE_KEY = 'navigator++(tabs)';

const makeState = (routesPresent: string[], routeNames: string[]): TabNavigationState<ParamListBase> => ({
  stale: false,
  key: STATE_KEY,
  index: 0,
  routeNames,
  routes: routesPresent.map((name) => ({ key: getRouteKey({ stateKey: STATE_KEY, name }), name })),
});

// Minimal descriptor map: a real descriptor per present route, keyed by routeKey.
const makeDescriptors = (state: TabNavigationState<ParamListBase>) =>
  Object.fromEntries(
    state.routes.map((route) => [
      route.key,
      {
        route,
        options: { title: `real-${route.name}` },
        render: () => <></>,
        navigation: {} as any,
      },
    ])
  );

// Stand-in for useNavigationBuilder's `describe(route, placeholder)`.
const makeDescribe = (descriptors: Record<string, any>) =>
  jest.fn((route: { key: string; name: string }, placeholder: boolean) => {
    if (!placeholder) return descriptors[route.key];
    return {
      route,
      options: { title: `placeholder-${route.name}` },
      render: () => <></>,
      navigation: {} as any,
    };
  });

test('adds placeholders for declared tabs not yet present, keyed by getRouteKey({ stateKey, name, index })', () => {
  const state = makeState(['home'], ['home', 'a', 'b']);
  const descriptors = makeDescriptors(state);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(state, descriptors, describe, ['home', 'a', 'b'])
  );
  const [augmentedState, augmentedDescriptors] = result.current;

  // `a` and `b` got placeholder routes with the exact key the router will later assign at index 0.
  const aKey = getRouteKey({ stateKey: STATE_KEY, name: 'a', index: 0 });
  const bKey = getRouteKey({ stateKey: STATE_KEY, name: 'b', index: 0 });
  expect(augmentedState.routes.find((r) => r.name === 'a')?.key).toBe(aKey);
  expect(augmentedState.routes.find((r) => r.name === 'b')?.key).toBe(bKey);
  // Descriptor map contains both real and placeholder entries.
  expect(augmentedDescriptors[aKey]).toBeDefined();
  expect(augmentedDescriptors[bKey]).toBeDefined();
});

test('placeholder key equals the real key assigned when the route materializes at index 0', () => {
  const placeholderState = makeState(['home'], ['home', 'a']);
  const descriptors = makeDescriptors(placeholderState);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(placeholderState, descriptors, describe, ['home', 'a'])
  );
  const placeholderKey = result.current[0].routes.find((r) => r.name === 'a')!.key;

  // When `a` actually materializes, the router keys it via getRouteKey({ stateKey, name, index }).
  const realKey = getRouteKey({ stateKey: STATE_KEY, name: 'a', index: 0 });
  expect(placeholderKey).toBe(realKey);
});

test('merges placeholders with real routes in declaration order', () => {
  // Present routes are in back-stack order (b before home); declaration order is home,a,b,c.
  const state = makeState(['b', 'home'], ['home', 'a', 'b', 'c']);
  const descriptors = makeDescriptors(state);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(state, descriptors, describe, ['home', 'a', 'b', 'c'])
  );

  expect(result.current[0].routes.map((r) => r.name)).toEqual(['home', 'a', 'b', 'c']);
});

test('does not create a placeholder for a route already present (keeps the real descriptor)', () => {
  const state = makeState(['home', 'a'], ['home', 'a']);
  const descriptors = makeDescriptors(state);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(state, descriptors, describe, ['home', 'a'])
  );
  const aKey = getRouteKey({ stateKey: STATE_KEY, name: 'a', index: 0 });

  // describe should never be asked for a placeholder of an already-present route.
  expect(describe).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'a' }), true);
  expect((result.current[1][aKey]!.options as { title: string }).title).toBe('real-a');
});

test('resolves placeholder options via describe up front (not lazily)', () => {
  const state = makeState(['home'], ['home', 'a']);
  const descriptors = makeDescriptors(state);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(state, descriptors, describe, ['home', 'a'])
  );
  const aKey = getRouteKey({ stateKey: STATE_KEY, name: 'a', index: 0 });

  // describe was called for the placeholder during the hook, and its resolved options are exposed.
  expect(describe).toHaveBeenCalledWith(expect.objectContaining({ name: 'a' }), true);
  expect((result.current[1][aKey]!.options as { title: string }).title).toBe('placeholder-a');
});

test('falls back to a valid in-range index (0) and warns when the focused route is absent from the shown set', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  // `state.index` is 2 (out of range for the shorter shown set), and the focused route ("c") is
  // NOT in routeNamesToShow, so focusedIndex resolves to -1.
  const state = { ...makeState(['home', 'a', 'c'], ['home', 'a', 'b', 'c']), index: 2 };
  const descriptors = makeDescriptors(state);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(state, descriptors, describe, ['home', 'a', 'b'])
  );
  const [augmentedState] = result.current;

  expect(augmentedState.index).toBe(0);
  expect(augmentedState.index).toBeLessThan(augmentedState.routes.length);
  expect(warn).toHaveBeenCalledTimes(1);

  warn.mockRestore();
});

test('returns referentially-stable output across a re-render with unchanged state/descriptors (describe is a fresh closure)', () => {
  const state = makeState(['home'], ['home', 'a']);
  const descriptors = makeDescriptors(state);
  // Stable across renders (real callers pass state.routeNames or a useMemo'd list).
  const routeNamesToShow = ['home', 'a'];

  const { result, rerender } = renderHook(
    // A fresh `describe` closure each render (mirrors useDescriptors), but stable state/descriptors.
    () =>
      useTabPlaceholders(state, descriptors, makeDescribe(descriptors), routeNamesToShow)
  );
  const first = result.current;

  rerender({});
  expect(result.current).toBe(first);
});

test('placeholder render returns null', () => {
  const state = makeState(['home'], ['home', 'a']);
  const descriptors = makeDescriptors(state);
  const describe = makeDescribe(descriptors);

  const { result } = renderHook(() =>
    useTabPlaceholders(state, descriptors, describe, ['home', 'a'])
  );
  const aKey = getRouteKey({ stateKey: STATE_KEY, name: 'a', index: 0 });

  expect(result.current[1][aKey]!.render()).toBeNull();
});
