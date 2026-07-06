import { expect, test } from '@jest/globals';

import {
  CommonActions,
  type ParamListBase,
  type RouterConfigOptions,
  StackActions,
  TabActions,
  type TabNavigationState,
  TabRouter,
} from '../index';

// New model: a route's presence in `state.routes` IS the loaded/preloaded signal, so `routes` is a
// SUBSET of `routeNames`. getInitialState materializes only the focused route (plus the back-stack
// anchor required by firstRoute/initialRoute); navigating to an absent route creates it; PRELOAD
// inserts a route without focusing it. There is no `preloadedRouteKeys` field anymore.
//
// Route keys are deterministic (see `getRouteKey`/`getStateKey`): a navigator with
// `parentRouteKey: undefined` gets the state key `@`, and a generated route key is
// `${stateKey}:${name}:${index}` (index is always emitted). Persisted keys fed into
// rehydration/route-name-change are kept as-is.
const names = (state: { routes: { name: string }[] }) => state.routes.map((r) => r.name);

// --- getInitialState ---------------------------------------------------------

test('gets initial state materializing only the focused route', () => {
  const router = TabRouter({});

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: '@:bar:0', name: 'bar' }],
    stale: false,
  });
});

test('gets initial state with initialRouteName, anchoring the first route', () => {
  // anchor = first route (bar), focused = baz -> [bar, baz] index 1 (subset of routeNames).
  const router = TabRouter({ initialRouteName: 'baz' });

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 1,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: '@:bar:0', name: 'bar' },
      { key: '@:baz:0', name: 'baz', params: { answer: 42 } },
    ],
    stale: false,
  });
});

test('gets initial state placing the initial route after the firstRoute anchor', () => {
  // declaration [bar, baz, qux], anchor = bar, focused = qux -> subset [bar, qux] index 1.
  const router = TabRouter({ backBehavior: 'firstRoute', initialRouteName: 'qux' });

  const state = router.getInitialState({
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  });

  expect(names(state)).toEqual(['bar', 'qux']);
  expect(state.index).toBe(1);
});

test('gets initial state anchored on the initial route with initialRoute back behavior', () => {
  // declaration [a, b, c], initialRoute b, focused = b (initial === anchor) -> subset [b] index 0.
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });

  const state = router.getInitialState({
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  });

  expect(names(state)).toEqual(['b']);
  expect(state.index).toBe(0);
});

test('gets initial state with only the focused route for order and none back behaviors', () => {
  // declaration [a, b, c], initial c -> subset [c], index 0.
  for (const backBehavior of ['order', 'none'] as const) {
    const router = TabRouter({ backBehavior, initialRouteName: 'c' });

    expect(
      router.getInitialState({
        routeNames: ['a', 'b', 'c'],
        routeParamList: {},
        parentRouteKey: undefined,
        routeGetIdList: {},
      })
    ).toEqual({
      index: 0,
      key: '@',
      routeNames: ['a', 'b', 'c'],
      routes: [{ key: '@:c:0', name: 'c' }],
      stale: false,
    });
  }
});

test('gets initial state with only the focused route for history', () => {
  // declaration [a, b, c], initial c, history -> subset [c] index 0.
  const router = TabRouter({ backBehavior: 'history', initialRouteName: 'c' });

  expect(
    router.getInitialState({
      routeNames: ['a', 'b', 'c'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: '@',
    routeNames: ['a', 'b', 'c'],
    routes: [{ key: '@:c:0', name: 'c' }],
    stale: false,
  });
});

test('derives deterministic route keys from the navigator parentRouteKey so tabs are precomputable', () => {
  const router = TabRouter({});

  const state = router.getInitialState({
    routeNames: ['home', 'settings'],
    parentRouteKey: '/(tabs)',
    routeParamList: {},
    routeGetIdList: {},
  });

  // The focused tab's key is a stable function of the navigator's state key + name — a tab bar can
  // compute `/(tabs):home:0` before the route is materialized.
  expect(state.routes.map((r) => r.key)).toEqual(['/(tabs):home:0']);
});

// --- getRehydratedState ------------------------------------------------------

test('rehydrates the persisted subset without appending undeclared-yet-absent tabs', () => {
  const router = TabRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Persisted [bar, qux] (baz never loaded). routes stays the persisted subset; firstRoute
  // keeps the anchor (bar) leading. Focused falls back to first -> [bar, qux] index 0.
  expect(
    router.getRehydratedState(
      {
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-1', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });

  // Single persisted tab baz. firstRoute anchor = first declared (bar) is added in front of
  // the focused baz -> subset [bar, baz] index 1.
  expect(
    router.getRehydratedState(
      {
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: '@:bar:0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
    ],
    stale: false,
  });
});

test('rehydrates with history, preserving the persisted subset and indexing by focused name', () => {
  const router = TabRouter({ backBehavior: 'history' });

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // history keeps the persisted subset verbatim; focused persisted index 0 = qux -> position 0.
  expect(
    router.getRehydratedState(
      {
        index: 0,
        routes: [
          { key: 'qux-9', name: 'qux' },
          { key: 'bar-9', name: 'bar' },
        ],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'qux-9', name: 'qux', params: { name: 'Jane' } },
      { key: 'bar-9', name: 'bar' },
    ],
    stale: false,
  });

  // Focused persisted index 1 = bar -> resolves to bar's position 1.
  expect(
    router.getRehydratedState(
      {
        index: 1,
        routes: [
          { key: 'qux-9', name: 'qux' },
          { key: 'bar-9', name: 'bar' },
        ],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'qux-9', name: 'qux', params: { name: 'Jane' } },
      { key: 'bar-9', name: 'bar' },
    ],
    stale: false,
  });

  // Empty persisted routes -> materialize the first declared route, index 0.
  expect(
    router.getRehydratedState(
      {
        index: 4,
        routes: [],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: '@:bar:0', name: 'bar' }],
    stale: false,
  });
});

test("doesn't rehydrate state if it's not stale", () => {
  const router = TabRouter({});

  const state: TabNavigationState<ParamListBase> = {
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('rehydrates with history, dropping persisted routes whose name no longer exists', () => {
  const router = TabRouter({ backBehavior: 'history', initialRouteName: 'bar' });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getRehydratedState(
      {
        index: 2,
        routes: [
          { key: 'foo-0', name: 'foo' },
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    key: '@',
    index: 2,
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo-0', name: 'foo' },
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    stale: false,
  });
});

test('rehydrates empty persisted state honoring initialRouteName/back behavior (no spurious anchor)', () => {
  // backBehavior initialRoute + non-first initial (b). Nothing persisted survives, so the result
  // must match getInitialState: focus the initial route, no extra anchor route.
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });

  const state = router.getRehydratedState(
    { stale: true, routes: [] },
    {
      routeNames: ['a', 'b', 'c'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    }
  );

  expect(names(state)).toEqual(['b']);
  expect(state.index).toBe(0);
});

test('rehydrates empty persisted state with firstRoute matching getInitialState', () => {
  const router = TabRouter({ backBehavior: 'firstRoute', initialRouteName: 'c' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const rehydrated = router.getRehydratedState({ stale: true, routes: [] }, options);
  const initial = router.getInitialState(options);

  // firstRoute anchor (a) + initial focused (c) -> subset [a, c] index 1, same as a fresh start.
  expect(names(rehydrated)).toEqual(['a', 'c']);
  expect(rehydrated.index).toBe(1);
  expect(names(rehydrated)).toEqual(names(initial));
  expect(rehydrated.index).toBe(initial.index);
});

// --- getStateForRouteNamesChange ---------------------------------------------

test('keeps the surviving subset and drops removed tabs on route names change with history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // Surviving tabs (baz, qux) keep their existing order; new tabs are NOT materialized (presence
  // is the loaded signal). Focused bar removed -> fall back to the first surviving tab (baz).
  expect(
    router.getStateForRouteNamesChange(
      {
        index: 0,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });

  // No surviving tabs -> materialize the first declared route.
  expect(
    router.getStateForRouteNamesChange(
      {
        index: 0,
        key: 'tab-test',
        routeNames: ['bar', 'baz'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
        ],
        stale: false,
      },
      {
        routeNames: ['foo', 'fiz'],
        routeParamList: {},
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['foo', 'fiz'],
    routes: [{ key: 'tab-test:foo:0', name: 'foo' }],
    stale: false,
  });
});

test('preserves the focused route and indexes by name on route names change with history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // Focused baz survives; surviving baz, qux keep their old order (baz then qux), so the
  // focused baz lands at index 0.
  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
      },
      {
        routeNames: ['qux', 'foo', 'fiz', 'baz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'foo', 'fiz', 'baz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });
});

test('drops key-changed tabs from the subset on route names change', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // bar is listed in routeKeyChanges -> treated as removed and dropped from the present subset
  // (it can be re-created on the next navigate). Focused name was bar -> falls back to the first
  // surviving route (baz).
  expect(
    router.getStateForRouteNamesChange(
      {
        index: 0,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-old', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
      },
      {
        routeNames: ['bar', 'baz', 'qux'],
        routeParamList: {},
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: ['bar'],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });
});

test('re-arranges the present subset around the anchor on route names change with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });

  // Focused baz survives. Surviving subset is [baz, qux]. firstRoute anchor = first declared
  // present route. Declaration order is [qux, baz, foo, fiz]; among the present subset, qux comes
  // first, so anchor = qux, focused = baz -> [qux, baz] index 1.
  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {},
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 1,
    key: 'tab-test',
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
    ],
    stale: false,
  });
});

test('falls back to the first surviving tab when the focused route is removed on route names change', () => {
  const router = TabRouter({ backBehavior: 'history' });

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
      },
      {
        routeNames: ['qux', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'foo', 'fiz'],
    routes: [{ key: 'qux-test', name: 'qux', params: { name: 'Jane' } }],
    stale: false,
  });
});

test('route names change with no survivors honors initialRouteName/back behavior (no spurious anchor)', () => {
  // backBehavior initialRoute + non-first initial (b). All present routes are dropped, so the
  // result must match getInitialState: focus the initial route, no extra anchor route.
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });

  const state = router.getStateForRouteNamesChange(
    {
      index: 0,
      key: 'tab-test',
      routeNames: ['x', 'y'],
      routes: [
        { key: 'x-test', name: 'x' },
        { key: 'y-test', name: 'y' },
      ],
      stale: false,
    },
    {
      routeNames: ['a', 'b', 'c'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
      routeKeyChanges: [],
    }
  );

  expect(names(state)).toEqual(['b']);
  expect(state.index).toBe(0);
});

test('route names change with no survivors and firstRoute focuses the first declared route', () => {
  const router = TabRouter({ backBehavior: 'firstRoute', initialRouteName: 'c' });

  const state = router.getStateForRouteNamesChange(
    {
      index: 0,
      key: 'tab-test',
      routeNames: ['x', 'y'],
      routes: [{ key: 'x-test', name: 'x' }],
      stale: false,
    },
    {
      routeNames: ['a', 'b', 'c'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
      routeKeyChanges: [],
    }
  );

  // firstRoute anchor (a) + initial focused (c) -> subset [a, c] index 1.
  expect(names(state)).toEqual(['a', 'c']);
  expect(state.index).toBe(1);
});

// --- navigate / JUMP_TO: order keeps declaration layout of present routes -----

test('navigates keeping present order and focusing the target with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Navigate baz (already present). routes stay [baz, bar]; index 0.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz', params: { color: 'tomato' } },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
  });
});

test('navigates creating an absent route and focusing it with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // qux is declared but absent from routes. Navigating creates it; order places present routes
  // in declaration order -> [baz, qux] focused qux.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'baz', name: 'baz' }],
      },
      CommonActions.navigate('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 } },
    ],
  });
});

test('jumps to a tab keeping order, no-op when already focused with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      TabActions.jumpTo('baz'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
  });

  // jumpTo the already-focused tab with no change -> returns the same state.
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
  };
  expect(router.getStateForAction(state, TabActions.jumpTo('bar'), options)).toBe(state);
});

// --- navigate / JUMP_TO: firstRoute / initialRoute arrange [anchor, focused, ...] --

test('navigates arranging [first, focused, ...rest present] with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Present [a, b, c], focus c -> [a, c, b] index 1.
  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['a', 'b', 'c'],
      routes: [
        { key: 'a-test', name: 'a' },
        { key: 'b-test', name: 'b' },
        { key: 'c-test', name: 'c' },
      ],
    },
    CommonActions.navigate('c'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(names(next)).toEqual(['a', 'c', 'b']);
  expect(next.index).toBe(1);

  // Focus the first route a -> [a, b, c] index 0 (anchor === focused).
  const backToAnchor = router.getStateForAction(
    next,
    CommonActions.navigate('a'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(backToAnchor)).toEqual(['a', 'b', 'c']);
  expect(backToAnchor.index).toBe(0);
});

test('navigates creating an absent route arranged after the anchor with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Present only [a]. Navigate c (absent) -> create it, anchor a leads -> [a, c] index 1.
  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['a', 'b', 'c'],
      routes: [{ key: 'a-test', name: 'a' }],
    },
    CommonActions.navigate('c'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(names(next)).toEqual(['a', 'c']);
  expect(next.index).toBe(1);
});

test('navigates arranging [initial, focused, ...rest present] with initialRoute', () => {
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Present [b, a, c], focus c, anchor b -> [b, c, a] index 1.
  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['a', 'b', 'c'],
      routes: [
        { key: 'b-test', name: 'b' },
        { key: 'a-test', name: 'a' },
        { key: 'c-test', name: 'c' },
      ],
    },
    CommonActions.navigate('c'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(names(next)).toEqual(['b', 'c', 'a']);
  expect(next.index).toBe(1);
});

test("doesn't navigate to a screen that isn't a declared route name", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
  };

  expect(
    router.getStateForAction(state, CommonActions.navigate('non-existent'), options)
  ).toBeNull();
  expect(
    router.getStateForAction(state, CommonActions.navigate('foo', { answer: 42 }), options)
  ).toBeNull();
});

test("doesn't jump to a screen that isn't a declared route name", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      TabActions.jumpTo('foo', { answer: 42 }),
      options
    )
  ).toBeNull();
});

// --- navigate / JUMP_TO: per-route id / params / path (order keeps layout) ----

test('ensures a fresh key for navigate when the route id changes with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
    },
  };

  // Navigate bar; its id changes, so it gets a fresh deterministic key. The current
  // route still holds `bar` (index 0), so the free key is `root:bar:1`.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'baz', name: 'baz' },
        ],
      },
      CommonActions.navigate('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'root:bar:1', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('adds path on navigate if provided with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate({ name: 'bar', path: '/foo/bar' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', path: '/foo/bar' },
      { key: 'qux', name: 'qux' },
    ],
  });

  // Navigate bar replacing its path -> path replaced, params set, in place.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', path: '/foo/bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate({ name: 'bar', params: { fruit: 'orange' }, path: '/foo/baz' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' }, path: '/foo/baz' },
      { key: 'qux', name: 'qux' },
    ],
  });
});

test("doesn't remove existing path on navigate if not provided with order", () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', path: '/foo/bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate({ name: 'bar' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', path: '/foo/bar' },
      { key: 'qux', name: 'qux' },
    ],
  });
});

test("doesn't merge params on navigate to an existing screen with order", () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      qux: { color: 'indigo' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Navigate bar, no params -> existing params dropped, in place.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate('bar'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux' },
    ],
  });

  // Navigate qux -> params come from routeParamList merged with the action params.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate('qux', { test: 12 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux', params: { color: 'indigo', test: 12 } },
    ],
  });
});

test('merges params on navigate to an existing screen if merge: true with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate({ name: 'bar', params: { fruit: 'orange' }, merge: true }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42, fruit: 'orange' } },
      { key: 'qux', name: 'qux' },
    ],
  });
});

// --- navigate / JUMP_TO: history splices into the back-stack -----------------

test('navigates splicing the target into the back-stack with history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['A', 'B', 'C', 'D', 'E'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Start: only A is materialized (focused).
  let state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['A']);
  expect(state.index).toBe(0);

  // navigate B (absent) -> create it, append after focused A -> [A, B] index 1.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('B'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['A', 'B']);
  expect(state.index).toBe(1);

  // navigate C (absent) -> [A, B, C] index 2.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('C'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['A', 'B', 'C']);
  expect(state.index).toBe(2);

  // navigate A (present, from 0 <= focused 2 -> remove A, insert at 2) -> [B, C, A] index 2.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('A'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['B', 'C', 'A']);
  expect(state.index).toBe(2);

  // navigate D (absent) -> appended after focused A -> [B, C, A, D] index 3.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('D'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['B', 'C', 'A', 'D']);
  expect(state.index).toBe(3);
});

// --- GO_BACK: history --------------------------------------------------------

test('walks the visit order on back with history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['A', 'B', 'C', 'D', 'E'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  let state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  for (const name of ['B', 'C', 'A', 'D']) {
    state = router.getStateForAction(
      state,
      CommonActions.navigate(name),
      options
    ) as TabNavigationState<ParamListBase>;
  }
  // After A->B->C->A->D: present routes [B, C, A, D], focus D (index 3).
  expect(names(state)).toEqual(['B', 'C', 'A', 'D']);
  expect(state.routes[state.index]!.name).toBe('D');

  // back walks D -> A -> C -> B over the present routes; order never changes.
  for (const expectedName of ['A', 'C', 'B']) {
    state = router.getStateForAction(
      state,
      CommonActions.goBack(),
      options
    ) as TabNavigationState<ParamListBase>;
    expect(names(state)).toEqual(['B', 'C', 'A', 'D']);
    expect(state.routes[state.index]!.name).toBe(expectedName);
  }

  // At B (index 0) there's nowhere further back -> null.
  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('walks back then navigates with history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['A', 'B', 'C'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  let state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  for (const name of ['B', 'C']) {
    state = router.getStateForAction(
      state,
      CommonActions.navigate(name),
      options
    ) as TabNavigationState<ParamListBase>;
  }
  // present [A, B, C], focus C (index 2).
  expect(names(state)).toEqual(['A', 'B', 'C']);
  expect(state.index).toBe(2);

  // back -> B (index 1).
  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(state.routes[state.index]!.name).toBe('B');
  expect(state.index).toBe(1);

  // navigate A (present, from 0 <= focused 1 -> remove A, insert at 1) -> [B, A, C] index 1.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('A'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['B', 'A', 'C']);
  expect(state.index).toBe(1);

  // back -> B (index 0).
  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(state.routes[state.index]!.name).toBe('B');
  expect(state.index).toBe(0);
});

test('returns null on back when at index 0 with history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  expect(state.index).toBe(0);
  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

// --- GO_BACK: position-based behaviors (uniformly index - 1 over present routes) ---

test('walks to the previous present tab on back with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Present [a, b, c]; focus c (index 2). back -> b (index 1).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 2,
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'a-test', name: 'a' },
      { key: 'b-test', name: 'b' },
      { key: 'c-test', name: 'c' },
    ],
  };

  const next = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(next)).toEqual(['a', 'b', 'c']);
  expect(next.routes[next.index]!.name).toBe('b');
  expect(next.index).toBe(1);

  // From the first present tab (index 0) there's nowhere to go -> null.
  expect(
    router.getStateForAction({ ...state, index: 0 }, CommonActions.goBack(), options)
  ).toBeNull();
});

test('goes to the present anchor on back with firstRoute, null when already first', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // firstRoute layout [a, focused, ...]; focus b at index 1. back -> a (index 0).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 1,
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'a-test', name: 'a' },
      { key: 'b-test', name: 'b' },
      { key: 'c-test', name: 'c' },
    ],
  };

  const next = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(next.routes[next.index]!.name).toBe('a');
  expect(next.index).toBe(0);

  // Already focused on the first route (index 0) -> null.
  expect(
    router.getStateForAction({ ...state, index: 0 }, CommonActions.goBack(), options)
  ).toBeNull();
});

test('goes to the initial route on back with initialRoute, null when already initial', () => {
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // initialRoute layout [b, focused, ...]; focus c at index 1. back -> b (index 0).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 1,
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'b-test', name: 'b' },
      { key: 'c-test', name: 'c' },
      { key: 'a-test', name: 'a' },
    ],
  };

  const next = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(next.routes[next.index]!.name).toBe('b');
  expect(next.index).toBe(0);

  // Already focused on the initial route (index 0) -> null.
  expect(
    router.getStateForAction({ ...state, index: 0 }, CommonActions.goBack(), options)
  ).toBeNull();
});

test('returns null on back with none', () => {
  const router = TabRouter({ backBehavior: 'none' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 2,
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'a-test', name: 'a' },
      { key: 'b-test', name: 'b' },
      { key: 'c-test', name: 'c' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('GO_BACK moves focus over present routes without reordering', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // firstRoute layout [a, c, b]; focus c at index 1. back -> a (index 0). Routes untouched.
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 1,
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'a-test', name: 'a' },
      { key: 'c-test', name: 'c' },
      { key: 'b-test', name: 'b' },
    ],
  };

  const next = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(next.index).toBe(0);
  expect(names(next)).toEqual(['a', 'c', 'b']);
});

// --- REPLACE: prunes the replaced route from the back stack ------------------

test('drops the replaced route so back is blocked with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['one', 'two'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Focus one (the first route) at index 0. replace two: JUMP_TO two -> firstRoute
  // [one, two] index 1, then prune route at index 0 (one) just past focused ->
  // [two, one] index 0. GO_BACK -> null.
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['one', 'two'],
    routes: [
      { key: 'one', name: 'one' },
      { key: 'two', name: 'two' },
    ],
  };

  const replaced = router.getStateForAction(
    state,
    // REPLACE isn't part of the tab action union; the wrapper handles it at runtime.
    StackActions.replace('two') as unknown as Parameters<typeof router.getStateForAction>[1],
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(replaced)).toEqual(['two', 'one']);
  expect(replaced.index).toBe(0);

  expect(router.getStateForAction(replaced, CommonActions.goBack(), options)).toBeNull();
});

test('drops the replaced route so back skips it with history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['one', 'two', 'three'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Start present [one] focus one. navigate two -> [one, two] index 1.
  let state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(
    state,
    CommonActions.navigate('two'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['one', 'two']);
  expect(state.index).toBe(1);

  // replace three: JUMP_TO three (absent) -> created, appended after focused two ->
  // [one, two, three] index 2; then prune the route at index 1 (two) past focused ->
  // [one, three, two] index 1. GO_BACK -> one.
  state = router.getStateForAction(
    state,
    StackActions.replace('three') as unknown as Parameters<typeof router.getStateForAction>[1],
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['one', 'three', 'two']);
  expect(state.index).toBe(1);

  const back = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(back.routes[back.index]!.name).toBe('one');
  expect(back.index).toBe(0);
});

// --- getStateForRouteFocus ---------------------------------------------------

test('focuses a route arranging [anchor, focused, ...] with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });

  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 0,
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'a-test', name: 'a' },
      { key: 'b-test', name: 'b' },
      { key: 'c-test', name: 'c' },
    ],
  };

  // Focus c -> [a, c, b] index 1.
  const next = router.getStateForRouteFocus(state, 'c-test');
  expect(names(next)).toEqual(['a', 'c', 'b']);
  expect(next.index).toBe(1);

  // Unknown key -> same state.
  expect(router.getStateForRouteFocus(state, 'missing')).toBe(state);
  // Already focused -> same state.
  expect(router.getStateForRouteFocus(state, 'a-test')).toBe(state);
});

test('focuses a route splicing into the back-stack with history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // present [A, B, C, D, E], focus C (index 2). Focus A (from 0 <= 2) -> remove A,
  // insert at 2 -> [B, C, A, D, E], index 2.
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'tab-test',
    index: 2,
    routeNames: ['A', 'B', 'C', 'D', 'E'],
    routes: [
      { key: 'A-test', name: 'A' },
      { key: 'B-test', name: 'B' },
      { key: 'C-test', name: 'C' },
      { key: 'D-test', name: 'D' },
      { key: 'E-test', name: 'E' },
    ],
  };

  const next = router.getStateForRouteFocus(state, 'A-test');
  expect(names(next)).toEqual(['B', 'C', 'A', 'D', 'E']);
  expect(next.index).toBe(2);

  // Already focused -> same state.
  expect(router.getStateForRouteFocus(state, 'C-test')).toBe(state);
});

// --- SET_PARAMS --------------------------------------------------------------

test('setParams updates the focused route without reordering', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const next = router.getStateForAction(
    {
      stale: false,
      key: 'tab-test',
      index: 1,
      routeNames: ['a', 'b', 'c'],
      routes: [
        { key: 'a-test', name: 'a' },
        { key: 'b-test', name: 'b' },
        { key: 'c-test', name: 'c' },
      ],
    },
    CommonActions.setParams({ answer: 42 }),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(names(next)).toEqual(['a', 'b', 'c']);
  expect(next.index).toBe(1);
  expect(next.routes[1]).toEqual({ key: 'b-test', name: 'b', params: { answer: 42 } });
});

// --- PRELOAD -----------------------------------------------------------------

test('preloads an absent route by inserting it without changing focus', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // qux is declared but absent. Preload inserts it (deterministic key) without touching index.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      CommonActions.preload('qux'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'root:qux:0', name: 'qux' },
    ],
  });
});

test('preloads an absent route with params', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'baz-test', name: 'baz' }],
      },
      CommonActions.preload('qux', { answer: 43 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 43 } },
    ],
  });
});

test('preloads an already-present route by updating its params in place', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => `bar-${params?.answer}`,
    },
  };

  // bar is present with a stale id; preload with a new id assigns a fresh deterministic key
  // (bar already occupies index 0 -> root:bar:1) and updates params, in place, without changing focus.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          { key: 'bar-test', name: 'bar', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux' },
        ],
      },
      CommonActions.preload('bar', { answer: 43 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'root:bar:1', name: 'bar', params: { answer: 43 } },
      { key: 'qux-test', name: 'qux' },
    ],
  });

  // Preload with the same id keeps the existing key.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          { key: 'bar-some', name: 'bar', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux' },
        ],
      },
      CommonActions.preload('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'bar-some', name: 'bar', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux' },
    ],
  });
});

test('drops a re-keyed route\'s retained nested state on an id change', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => `bar-${params?.answer}`,
    },
  };

  // `bar` carries a nested subtree. Preloading it with a changed id re-keys it (fresh identity) —
  // the retained `state` belongs to the old identity and must be dropped so the subtree remounts
  // clean; a re-minted key must never land on stale state.
  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [
        {
          key: 'bar-42',
          name: 'bar',
          params: { answer: 42 },
          state: {
            stale: false,
            key: 'bar-42',
            index: 0,
            routeNames: ['inner'],
            routes: [{ key: 'bar-42:inner:0', name: 'inner' }],
          },
        } as any,
      ],
    },
    CommonActions.preload('bar', { answer: 43 }),
    options
  );

  const bar = next!.routes.find((r) => r.name === 'bar')!;
  expect(bar.key).not.toBe('bar-42');
  expect((bar as any).state).toBeUndefined();
});

test('navigates to a preloaded route, focusing it with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // qux was preloaded (present). Navigating just focuses it; order keeps declaration layout.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          { key: 'bar-test', name: 'bar', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux' },
        ],
      },
      CommonActions.navigate('qux'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'bar-test', name: 'bar', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux' },
    ],
  });
});

test("doesn't preload a screen that isn't a declared route name", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.preload('non-existent'),
      options
    )
  ).toBeNull();
});

// --- FRONT_PRELOAD ------------------------------------------------------------
// Like PRELOAD, but inserts the implicit back-stack anchor at the FRONT of the routes so GO_BACK
// lands on it. Only used for the firstRoute/initialRoute anchor; present routes are never reordered.

test('front-preloads an absent route at the front, shifting focus to keep the focused route', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['anchor', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // anchor is declared but absent (deep-linked straight to bar). Front-preload inserts it at index 0
  // and bumps index so bar stays focused; a later GO_BACK now lands on anchor.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['anchor', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar', params: { answer: 42 } }],
      },
      TabActions.frontPreload('anchor'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['anchor', 'bar', 'qux'],
    routes: [
      { key: 'root:anchor:0', name: 'anchor' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
    ],
  });
});

test('front-preloads an absent route with params', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['anchor', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['anchor', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      TabActions.frontPreload('anchor', { welcome: true }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['anchor', 'bar', 'qux'],
    routes: [
      { key: 'root:anchor:0', name: 'anchor', params: { welcome: true } },
      { key: 'bar', name: 'bar' },
    ],
  });
});

test('front-preloading an already-present route is a no-op (never reorders history)', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['anchor', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Present at the tail: it must stay put, not be moved to the front.
  const presentAtTail: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['anchor', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'anchor', name: 'anchor' },
    ],
  };
  expect(router.getStateForAction(presentAtTail, TabActions.frontPreload('anchor'), options)).toBe(
    presentAtTail
  );

  // Present at the front already: still a no-op (same identity).
  const presentAtFront: TabNavigationState<ParamListBase> = {
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['anchor', 'bar', 'qux'],
    routes: [
      { key: 'anchor', name: 'anchor' },
      { key: 'bar', name: 'bar' },
    ],
  };
  expect(router.getStateForAction(presentAtFront, TabActions.frontPreload('anchor'), options)).toBe(
    presentAtFront
  );
});

test.each(['order', 'history', 'none'] as const)(
  'front-preload is a no-op and warns in dev with backBehavior %s (no implicit anchor to arrange)',
  (backBehavior) => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const router = TabRouter({ backBehavior });
    const options: RouterConfigOptions = {
      routeNames: ['anchor', 'bar', 'qux'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    };

    const state: TabNavigationState<ParamListBase> = {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['anchor', 'bar', 'qux'],
      routes: [{ key: 'bar', name: 'bar' }],
    };

    expect(router.getStateForAction(state, TabActions.frontPreload('anchor'), options)).toBe(state);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining(`backBehavior is "${backBehavior}"`));

    warn.mockRestore();
  }
);

test("doesn't front-preload a screen that isn't a declared route name", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['anchor', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['anchor', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      TabActions.frontPreload('non-existent'),
      options
    )
  ).toBeNull();
});
