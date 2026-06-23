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

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

// Route keys are now deterministic (see `getRouteKey`): with no navigator `id` passed, a generated
// key is just the route name (index 0), or `name-N` for repeated same-name routes. Container keys
// still use the mocked nanoid (`tab-test`). Persisted keys fed into rehydration/route-name-change
// are preserved verbatim.
const names = (state: { routes: { name: string }[] }) => state.routes.map((r) => r.name);

// --- getInitialState ---------------------------------------------------------

test('gets initial state focusing the first route', () => {
  const router = TabRouter({});

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
      pathname: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'qux', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('gets initial state with initialRouteName, anchoring the first route', () => {
  // anchor = first route (bar), focused = baz -> [bar, baz, qux] index 1.
  const router = TabRouter({ initialRouteName: 'baz' });

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
      pathname: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 1,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'qux', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('gets initial state placing the initial route after the firstRoute anchor', () => {
  // declaration [bar, baz, qux], anchor = bar, focused = qux -> [bar, qux, baz] index 1.
  const router = TabRouter({ backBehavior: 'firstRoute', initialRouteName: 'qux' });

  const state = router.getInitialState({
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  });

  expect(names(state)).toEqual(['bar', 'qux', 'baz']);
  expect(state.index).toBe(1);
});

test('gets initial state anchored on the initial route with initialRoute back behavior', () => {
  // declaration [a, b, c], initialRoute b, focused = b (the initial = anchor) ->
  // [b, a, c] index 0.
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });

  const state = router.getInitialState({
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  });

  expect(names(state)).toEqual(['b', 'a', 'c']);
  expect(state.index).toBe(0);
});

test('gets initial state in declaration order for order and none back behaviors', () => {
  // declaration [a, b, c], initial c -> stay [a, b, c], index 2.
  for (const backBehavior of ['order', 'none'] as const) {
    const router = TabRouter({ backBehavior, initialRouteName: 'c' });

    expect(
      router.getInitialState({
        routeNames: ['a', 'b', 'c'],
        routeParamList: {},
        pathname: undefined,
        routeGetIdList: {},
      })
    ).toEqual({
      index: 2,
      key: 'tab-test',
      routeNames: ['a', 'b', 'c'],
      routes: [
        { key: 'a', name: 'a' },
        { key: 'b', name: 'b' },
        { key: 'c', name: 'c' },
      ],
      stale: false,
      preloadedRouteKeys: [],
    });
  }
});

test('gets initial state moving a non-first initial route to the front with history', () => {
  // declaration [a, b, c], initial c, history -> [c, a, b] index 0.
  const router = TabRouter({ backBehavior: 'history', initialRouteName: 'c' });

  expect(
    router.getInitialState({
      routeNames: ['a', 'b', 'c'],
      routeParamList: {},
      pathname: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'c', name: 'c' },
      { key: 'a', name: 'a' },
      { key: 'b', name: 'b' },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('gets initial state in declaration order when the initial route is already first with history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  expect(
    router.getInitialState({
      routeNames: ['a', 'b', 'c'],
      routeParamList: {},
      pathname: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['a', 'b', 'c'],
    routes: [
      { key: 'a', name: 'a' },
      { key: 'b', name: 'b' },
      { key: 'c', name: 'c' },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('derives deterministic route keys from the navigator pathname so tabs are precomputable', () => {
  const router = TabRouter({});

  const state = router.getInitialState({
    routeNames: ['home', 'settings'],
    pathname: '/(tabs)',
    routeParamList: {},
    routeGetIdList: {},
  });

  // Each tab name appears once (index 0), so its key is a stable function of pathname + name —
  // a tab bar can compute `/(tabs)-home` before the route is materialized.
  expect(state.routes.map((r) => r.key)).toEqual(['/(tabs)-home', '/(tabs)-settings']);
});

// --- getRehydratedState ------------------------------------------------------

test('rehydrates partial state, appending newly-declared tabs at the end', () => {
  const router = TabRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    pathname: undefined,
    routeGetIdList: {},
  };

  // Persisted [bar, qux] (baz missing). Persisted keys are preserved, but firstRoute
  // re-arranges into the declaration-order back-stack: anchor = first declared (bar),
  // focused = bar -> [bar, baz, qux] index 0.
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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });

  // Single persisted tab baz; missing tabs appended in declaration order. firstRoute
  // anchor = first declared (bar), focused = baz -> [bar, baz, qux] index 1.
  expect(
    router.getRehydratedState(
      {
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('rehydrates with history, preserving persisted order and indexing by focused name', () => {
  const router = TabRouter({ backBehavior: 'history' });

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    pathname: undefined,
    routeGetIdList: {},
  };

  // history keeps the persisted visit order; missing baz appended at the end.
  // Focused persisted index 0 = qux -> position 0.
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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'qux-9', name: 'qux', params: { name: 'Jane' } },
      { key: 'bar-9', name: 'bar' },
      { key: 'baz', name: 'baz', params: { answer: 42 } },
    ],
    stale: false,
    preloadedRouteKeys: [],
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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'qux-9', name: 'qux', params: { name: 'Jane' } },
      { key: 'bar-9', name: 'bar' },
      { key: 'baz', name: 'baz', params: { answer: 42 } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });

  // Empty persisted routes -> declaration order, index falls back to 0.
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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'qux', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
      pathname: undefined,
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('rehydrates with history, preserving persisted route order verbatim', () => {
  const router = TabRouter({ backBehavior: 'history', initialRouteName: 'bar' });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    pathname: undefined,
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
    key: 'tab-test',
    index: 2,
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo-0', name: 'foo' },
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

// --- getStateForRouteNamesChange ---------------------------------------------

test('keeps surviving order and appends new tabs on route names change with history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // Surviving tabs (baz, qux) keep their existing order; new tabs (foo, fiz)
  // appended at the end in declaration order. Focused bar removed -> fall back to
  // first rebuilt tab (baz) at index 0.
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
        preloadedRouteKeys: [],
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        pathname: undefined,
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
      { key: 'foo', name: 'foo' },
      { key: 'fiz', name: 'fiz', params: { fruit: 'apple' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });

  // No surviving tabs -> all new, declaration order.
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
        preloadedRouteKeys: [],
      },
      {
        routeNames: ['foo', 'fiz'],
        routeParamList: {},
        pathname: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['foo', 'fiz'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'fiz', name: 'fiz' },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('preserves the focused route and indexes by name on route names change with history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // Focused baz survives; surviving baz, qux keep old order (baz then qux), so
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
        preloadedRouteKeys: [],
      },
      {
        routeNames: ['qux', 'foo', 'fiz', 'baz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        pathname: undefined,
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
      { key: 'foo', name: 'foo' },
      { key: 'fiz', name: 'fiz', params: { fruit: 'apple' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('appends key-changed tabs at the end on route names change', () => {
  const router = TabRouter({ backBehavior: 'history' });

  // bar is listed in routeKeyChanges -> treated as new and appended at the end
  // with a fresh key, even though its name still exists. Focused name is still bar
  // -> resolves by name to bar's new position (2).
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
        preloadedRouteKeys: [],
      },
      {
        routeNames: ['bar', 'baz', 'qux'],
        routeParamList: {},
        pathname: undefined,
        routeGetIdList: {},
        routeKeyChanges: ['bar'],
      }
    )
  ).toEqual({
    index: 2,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
      { key: 'bar', name: 'bar', params: undefined },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('re-arranges the back stack around the anchor on route names change with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });

  // Focused baz survives. Surviving order is [baz, qux]; rebuilt with appended
  // foo, fiz -> [baz, qux, foo, fiz]. firstRoute anchor = first declared (qux),
  // focused = baz -> [qux, baz, foo, fiz] index 1.
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
        preloadedRouteKeys: [],
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {},
        pathname: undefined,
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
      { key: 'foo', name: 'foo' },
      { key: 'fiz', name: 'fiz' },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

test('falls back to the first rebuilt tab when the focused route is removed on route names change', () => {
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
        preloadedRouteKeys: [],
      },
      {
        routeNames: ['qux', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        pathname: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'foo', 'fiz'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
      { key: 'foo', name: 'foo' },
      { key: 'fiz', name: 'fiz', params: { fruit: 'apple' } },
    ],
    stale: false,
    preloadedRouteKeys: [],
  });
});

// --- navigate / JUMP_TO: order keeps declaration layout ----------------------

test('navigates keeping declaration order and focusing the target with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // Navigate baz (declaration position 0). routes stay [baz, bar]; index 0.
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
  });
});

test('jumps to a tab keeping declaration order, no-op when already focused with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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

test('navigates arranging [first, focused, ...rest] with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // Focus c -> [a, c, b] index 1.
  const next = router.getStateForAction(
    {
      stale: false,
      preloadedRouteKeys: [],
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

test('navigates arranging [initial, focused, ...rest] with initialRoute', () => {
  const router = TabRouter({ backBehavior: 'initialRoute', initialRouteName: 'b' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // Focus c, anchor b -> [b, c, a] index 1.
  const next = router.getStateForAction(
    {
      stale: false,
      preloadedRouteKeys: [],
      key: 'root',
      index: 1,
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

test("doesn't navigate to nonexistent screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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

test("doesn't jump to nonexistent screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
    },
  };

  // Navigate bar; its id changes, so it gets a fresh deterministic key. The current
  // route still holds `bar` (index 0), so the free key is `bar-1`.
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar-1', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('adds path on navigate if provided with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  // Navigate bar, no params -> existing params dropped, in place.
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  // Start: routes [A, B, C, D, E], focus A (index 0).
  let state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['A', 'B', 'C', 'D', 'E']);
  expect(state.index).toBe(0);

  // navigate B (from 1 > focused 0 -> insert at 1) -> order unchanged, index 1.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('B'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['A', 'B', 'C', 'D', 'E']);
  expect(state.index).toBe(1);

  // navigate C (from 2 > focused 1 -> insert at 2) -> order unchanged, index 2.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('C'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['A', 'B', 'C', 'D', 'E']);
  expect(state.index).toBe(2);

  // navigate A (from 0 <= focused 2 -> remove A, insert at 2) -> [B, C, A, D, E], index 2.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('A'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['B', 'C', 'A', 'D', 'E']);
  expect(state.index).toBe(2);

  // navigate D (from 3 > focused 2 -> insert at 3) -> order unchanged, index 3.
  state = router.getStateForAction(
    state,
    CommonActions.navigate('D'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['B', 'C', 'A', 'D', 'E']);
  expect(state.index).toBe(3);
});

// --- GO_BACK: history --------------------------------------------------------

test('walks the visit order on back with history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['A', 'B', 'C', 'D', 'E'],
    routeParamList: {},
    pathname: undefined,
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
  // After A->B->C->A->D: routes [B, C, A, D, E], focus D (index 3).
  expect(names(state)).toEqual(['B', 'C', 'A', 'D', 'E']);
  expect(state.routes[state.index]!.name).toBe('D');

  // Visit order [B, C, A, D] (A re-visited, so it moved to the top).
  // back walks D -> A -> C -> B, routes order never changes.
  for (const expectedName of ['A', 'C', 'B']) {
    state = router.getStateForAction(
      state,
      CommonActions.goBack(),
      options
    ) as TabNavigationState<ParamListBase>;
    expect(names(state)).toEqual(['B', 'C', 'A', 'D', 'E']);
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
    pathname: undefined,
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
  // routes [A, B, C], focus C (index 2).
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

  // navigate A (from 0 <= focused 1 -> remove A, insert at 1) -> [B, A, C], index 1.
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
    pathname: undefined,
    routeGetIdList: {},
  };

  const state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  expect(state.index).toBe(0);
  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

// --- GO_BACK: position-based behaviors (uniformly index - 1, no reorder) ------

test('walks to the declaration-previous tab on back with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // order layout is declaration order; focus c (index 2). back -> b (index 1).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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

  // From the first declared tab (index 0) there's nowhere to go -> null.
  expect(
    router.getStateForAction({ ...state, index: 0 }, CommonActions.goBack(), options)
  ).toBeNull();
});

test('goes to the first route on back with firstRoute, null when already first', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // firstRoute layout [a, focused, ...]; focus b at index 1. back -> a (index 0).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  // initialRoute layout [b, focused, ...]; focus c at index 1. back -> b (index 0).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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

test('GO_BACK drops the target key from preloadedRouteKeys without reordering', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'c'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // firstRoute layout [a, c, b]; focus c at index 1. back -> a (index 0).
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: ['a-test', 'b-test'],
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
  // a's key (the new focused route) is removed from preloadedRouteKeys.
  expect(next.preloadedRouteKeys).toEqual(['b-test']);
});

// --- REPLACE: prunes the replaced route from the back stack ------------------

test('drops the replaced route so back is blocked with firstRoute', () => {
  const router = TabRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['one', 'two'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  // Focus one (the first route) at index 0. replace two: JUMP_TO two -> firstRoute
  // [one, two] index 1, then prune route at index 0 (one) just past focused ->
  // [two, one] index 0. GO_BACK -> null.
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  // Start [one, two, three] focus one. navigate two -> index 1 (back stack one->two).
  let state = router.getInitialState(options) as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(
    state,
    CommonActions.navigate('two'),
    options
  ) as TabNavigationState<ParamListBase>;
  expect(names(state)).toEqual(['one', 'two', 'three']);
  expect(state.index).toBe(1);

  // replace three: JUMP_TO three (from 2 > focused 1 -> insert at 2) -> [one, two,
  // three] index 2; then prune the route at index 1 (two) past focused ->
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
    preloadedRouteKeys: [],
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

  // routes [A, B, C, D, E], focus C (index 2). Focus A (from 0 <= 2) -> remove A,
  // insert at 2 -> [B, C, A, D, E], index 2.
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    preloadedRouteKeys: [],
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
    pathname: undefined,
    routeGetIdList: {},
  };

  const next = router.getStateForAction(
    {
      stale: false,
      preloadedRouteKeys: [],
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

test('handles screen preloading in place without reordering', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {
      bar: ({ params }) => `bar-${params?.answer}`,
    },
  };

  // Preload qux -> added to preloadedRouteKeys, routes unchanged, index unchanged.
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.preload('qux'),
      options
    )
  ).toEqual({
    stale: false,
    preloadedRouteKeys: ['qux'],
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'qux', name: 'qux' },
    ],
  });

  // Preload bar with a new id -> fresh deterministic key, params updated in place.
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: ['bar-1'],
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'bar-1', name: 'bar', params: { answer: 43 } },
      { key: 'qux-test', name: 'qux' },
    ],
  });

  // Preload bar replacing an existing preloaded entry (key changes -> old key dropped).
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: ['bar-test-old'],
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          { key: 'bar-test-old', name: 'bar', params: { answer: 42, willBe: 'removed' } },
          { key: 'qux-test', name: 'qux' },
        ],
      },
      CommonActions.preload('bar', { answer: 43 }),
      options
    )
  ).toEqual({
    stale: false,
    preloadedRouteKeys: ['bar-1'],
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'bar-1', name: 'bar', params: { answer: 43 } },
      { key: 'qux-test', name: 'qux' },
    ],
  });

  // Preload with the same id keeps the existing key.
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: ['bar-some'],
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

test('navigates to a preloaded route, focusing it and dropping it from preloadedRouteKeys with order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: ['qux-test'],
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
    preloadedRouteKeys: [],
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

test("doesn't preload a nonexistent screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    pathname: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
