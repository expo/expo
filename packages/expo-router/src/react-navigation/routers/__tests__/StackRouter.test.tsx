import { expect, test } from '@jest/globals';

import {
  CommonActions,
  type NavigationState,
  type PartialState,
  RECONCILE_ROUTE_NAMES,
  type ReconcileRouteNamesAction,
  type RouterConfigOptions,
  StackActions,
  StackRouter,
} from '..';

type ReconcileConfig = RouterConfigOptions & { routeKeyChanges?: string[] };

// Route-names reconciliation moved into `getStateForAction` as a `RECONCILE_ROUTE_NAMES` case. These
// helpers dispatch that action instead of calling the former standalone methods.
//
// `reconcileRouteNames` (former `getStateForRouteNamesChange`): the route-names-change branch runs on
// the committed `state` when no unhandled state is supplied.
function reconcileRouteNames(
  router: ReturnType<typeof StackRouter>,
  state: NavigationState,
  config: ReconcileConfig
) {
  const action: ReconcileRouteNamesAction = {
    type: RECONCILE_ROUTE_NAMES,
    target: state.key,
    payload: { routeKeyChanges: [], ...config },
  };
  return router.getStateForAction(
    state,
    action as unknown as Parameters<typeof router.getStateForAction>[1],
    config
  ) as NavigationState;
}

// `restoreUnhandled` (former `getRehydratedState`): the unhandled-state-restore branch runs only when
// the committed routes are disjoint from the new route names, so we reduce against a synthetic
// committed state with a single absent route. Rehydration keys off `config.parentRouteKey`, so the
// synthetic state's own key never appears in the output.
function restoreUnhandled(
  router: ReturnType<typeof StackRouter>,
  unhandledState: PartialState<NavigationState> | NavigationState,
  config: ReconcileConfig
) {
  const committed: NavigationState = {
    stale: false,
    key: '__committed__',
    index: 0,
    routeNames: ['__absent__'],
    routes: [{ key: '__absent__', name: '__absent__' }],
  };
  const action: ReconcileRouteNamesAction = {
    type: RECONCILE_ROUTE_NAMES,
    target: committed.key,
    payload: { routeKeyChanges: [], ...config, unhandledState },
  };
  return router.getStateForAction(
    committed,
    action as unknown as Parameters<typeof router.getStateForAction>[1],
    config
  ) as NavigationState;
}

test('rehydrates keyless same-name routes to sequential free keys', () => {
  const router = StackRouter({});

  // Each keyless route derives its key against the routes already built, so repeated same-name
  // routes land on the next free index instead of colliding.
  const state = restoreUnhandled(
    router,
    {
      index: 2,
      routes: [{ name: 'a' }, { name: 'a' }, { name: 'a' }],
    },
    { routeNames: ['a'], parentRouteKey: '/(tabs)', routeParamList: {}, routeGetIdList: {} }
  );

  const keys = state.routes.map((r) => r.key);
  expect(keys).toEqual(['/(tabs):a:0', '/(tabs):a:1', '/(tabs):a:2']);
  expect(new Set(keys).size).toBe(keys.length);
});

test('gets rehydrated state from partial state', () => {
  const router = StackRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    restoreUnhandled(
      router,
      {
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-1', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });

  expect(
    restoreUnhandled(
      router,
      {
        index: 2,
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-1', name: 'baz' },
          { key: 'qux-2', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    index: 2,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });

  expect(
    restoreUnhandled(
      router,
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

test('restores an already-complete unhandled state verbatim', () => {
  const router = StackRouter({});

  const state = {
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false as const,
  };

  // A complete unhandled state is returned by identity — nothing to rebuild.
  expect(
    restoreUnhandled(router, state, {
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('gets state on route names change', () => {
  const router = StackRouter({});

  expect(
    reconcileRouteNames(
    router,
      {
        index: 2,
        key: 'stack-test',
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
    index: 1,
    key: 'stack-test',
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });

  expect(
    reconcileRouteNames(
    router,
      {
        index: 1,
        key: 'stack-test',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
      },
      {
        routeNames: ['baz', 'qux'],
        routeParamList: {
          baz: { name: 'John' },
        },
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'stack-test:baz:0', name: 'baz', params: { name: 'John' } }],
    stale: false,
  });
});

test('gets state on route names change with initialRouteName', () => {
  const router = StackRouter({ initialRouteName: 'qux' });

  expect(
    reconcileRouteNames(
    router,
      {
        index: 1,
        key: 'stack-test',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
      },
      {
        routeNames: ['baz', 'qux'],
        routeParamList: {
          baz: { name: 'John' },
        },
        parentRouteKey: undefined,
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'stack-test:qux:0', name: 'qux' }],
    stale: false,
  });
});

test('handles navigate action', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('qux', { answer: 42 }),
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
      {
        key: 'root:qux:0',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('baz', { answer: 42 }),
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
      { key: 'root:baz:1', name: 'baz', params: { answer: 42 } },
    ],
  });
});

test('updates params on navigate if already on the screen', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42, color: 'tomato' } },
        ],
      },
      CommonActions.navigate('bar', { answer: 96 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 96 } },
    ],
  });
});

test('merges params on navigate when specified', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { color: 'tomato' } },
        ],
      },
      CommonActions.navigate('bar', { answer: 96 }, { merge: true }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 96, color: 'tomato' } },
    ],
  });
});

test("doesn't navigate to nonexistent screen", () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('far', { answer: 42 }),
      options
    )
  ).toBeNull();
});

test('ensures unique ID for navigate', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
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
      { key: 'bar', name: 'bar' },
      { key: 'root:bar:1', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
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
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
          { key: 'bar', name: 'bar' },
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
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
        ],
      },
      CommonActions.navigate('bar', { foo: 'b' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
      { key: 'root:bar:2', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('ensure unique ID is only per route name for navigate', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.test,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'qux-test', name: 'qux', params: { test: 'a' } },
          { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
        ],
      },
      CommonActions.navigate('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { test: 'a' } },
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'root:bar:0', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('goes back to matching screen for navigate if pop: true', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate({
        name: 'qux',
        params: { answer: 42 },
        pop: true,
      }),
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
      {
        key: 'root:qux:0',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate({
        name: 'baz',
        params: { answer: 42 },
        pop: true,
      }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      CommonActions.navigate({
        name: 'bar',
        params: { answer: 96 },
        pop: true,
      }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 96 } },
    ],
  });
});

test('goes back to matching ID for navigate if pop: true', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
        ],
      },
      CommonActions.navigate({
        name: 'bar',
        params: { foo: 'a' },
        pop: true,
      }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-a', name: 'bar', params: { foo: 'a' } },
          { key: 'bar-b', name: 'bar', params: { foo: 'b' } },
          { key: 'bar-c', name: 'bar', params: { foo: 'c' } },
        ],
      },
      CommonActions.navigate({
        name: 'bar',
        params: { foo: 'b' },
        pop: true,
      }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    // `bar-b` (matched) becomes active; `bar-c` was inactive and is preserved in the tail.
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-a', name: 'bar', params: { foo: 'a' } },
      { key: 'bar-b', name: 'bar', params: { foo: 'b' } },
      { key: 'bar-c', name: 'bar', params: { foo: 'c' } },
    ],
  });
});

test('handles navigate action (legacy)', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigateDeprecated('qux', { answer: 42 }),
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
      {
        key: 'root:qux:0',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigateDeprecated('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      CommonActions.navigateDeprecated('bar', { answer: 96 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 96 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigateDeprecated('unknown'),
      options
    )
  ).toBeNull();
});

test("doesn't navigate to nonexistent screen (legacy)", () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigateDeprecated('far', { answer: 42 }),
      options
    )
  ).toBeNull();

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigateDeprecated({
        name: 'far',
        params: { answer: 42 },
      }),
      options
    )
  ).toBeNull();
});

test('ensures unique ID for navigate (legacy)', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      CommonActions.navigateDeprecated('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'root:bar:1', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
        ],
      },
      CommonActions.navigateDeprecated('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
        ],
      },
      CommonActions.navigateDeprecated('bar', { foo: 'b' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
      { key: 'root:bar:2', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('ensure unique ID is only per route name for navigate (legacy)', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.test,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'qux-test', name: 'qux', params: { test: 'a' } },
          { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
        ],
      },
      CommonActions.navigateDeprecated('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { test: 'a' } },
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'root:bar:0', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('handles go back action', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.goBack(),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'baz', name: 'baz' }],
      },
      CommonActions.goBack(),
      options
    )
  ).toBeNull();
});

test('handles pop action', () => {
  const router = StackRouter({});
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
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.pop(),
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
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.pop(2),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.pop(4),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-0', name: 'qux' },
        ],
      },
      {
        ...StackActions.pop(),
        target: 'root',
        source: 'bar-0',
      },
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 4,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-0', name: 'baz' },
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-0', name: 'qux' },
          { key: 'quy-0', name: 'quy' },
          { key: 'quz-0', name: 'quz' },
        ],
      },
      {
        ...StackActions.pop(2),
        target: 'root',
        source: 'qux-0',
      },
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-0', name: 'baz' },
      { key: 'quy-0', name: 'quy' },
      { key: 'quz-0', name: 'quz' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      StackActions.pop(),
      options
    )
  ).toBeNull();
});

test('handles pop to top action', () => {
  const router = StackRouter({});
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
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popToTop(),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });
});

test('replaces focused screen with replace', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      StackActions.replace('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test('replaces active screen with replace', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('qux', { answer: 42 }),
        source: 'baz',
      },
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test("handles replace if source key isn't present but target is not specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('qux', { answer: 42 }),
        source: 'magic',
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'root',
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    stale: false,
  });
});

test("doesn't handle replace if source key isn't present when target is specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('qux', { answer: 42 }),
        source: 'magic',
        target: 'root',
      },
      options
    )
  ).toBeNull();
});

test("doesn't handle replace if screen to replace with isn't present", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.replace('nonexistent', { answer: 42 }),
        source: 'magic',
      },
      options
    )
  ).toBeNull();
});

test('handles push action', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      baz: { foo: 21 },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('baz'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'root:baz:0', name: 'baz', params: { foo: 21 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('baz', { bar: 29 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'root:baz:0', name: 'baz', params: { foo: 21, bar: 29 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('unknown'),
      options
    )
  ).toBeNull();
});

test("doesn't push nonexistent screen", () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      StackActions.push('far', { answer: 42 }),
      options
    )
  ).toBeNull();
});

test('ensures unique ID for push', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'root:bar:1', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
        ],
      },
      StackActions.push('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'bar', name: 'bar' },
          { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
        ],
      },
      StackActions.push('bar', { foo: 'b' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
      { key: 'root:bar:2', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('ensure unique ID is only per route name for push', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.test,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'qux-test', name: 'qux', params: { test: 'a' } },
          { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
        ],
      },
      StackActions.push('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { test: 'a' } },
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'root:bar:0', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('handles popTo action', () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      StackActions.popTo('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'root:qux:0',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      StackActions.popTo('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.popTo('bar', { answer: 96 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 96 } },
    ],
  });
});

test("doesn't popTo to nonexistent screen", () => {
  const router = StackRouter({});
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
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('far', { answer: 42 }),
      options
    )
  ).toBeNull();
});

test("doesn't merge params on popTo to an existing screen", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popTo('bar'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { color: 'test' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.popTo('bar', { fruit: 'orange' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { color: 'test', fruit: 'orange' } },
    ],
  });
});

test('merges params on popTo to an existing screen if merge: true', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
      baz: { foo: 12 },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
      },

      StackActions.popTo('bar', {}, { merge: true }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { color: 'test', answer: 42 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.popTo('bar', { fruit: 'orange' }, { merge: true }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar',
        name: 'bar',
        params: { color: 'test', fruit: 'orange', answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz', params: { test: 99 } },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.popTo('baz', { color: 'black' }, { merge: true }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        params: { foo: 12, test: 99, color: 'black' },
      },
    ],
  });
});

test("handles popTo if source key isn't present but target is not specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.popTo('qux', { answer: 42 }),
        source: 'magic',
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'root',
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    // `baz` was inactive (position > index), so it is preserved in the tail.
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    stale: false,
  });
});

test('handles popTo when source and target match a route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.popTo('qux', { answer: 42 }),
        source: 'bar',
        target: 'root',
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'root',
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 } },
    ],
    stale: false,
  });
});

test("doesn't handle popTo if source key isn't present when target is specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      {
        ...StackActions.popTo('qux', { answer: 42 }),
        source: 'magic',
        target: 'root',
      },
      options
    )
  ).toBeNull();
});

test('adds route to preloaded list with preload', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
      baz: { foo: 12 },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
      },

      CommonActions.preload('bar'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    // Preloaded route is appended to the inactive tail (position > index).
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'qux', name: 'qux' },
      { key: 'root:bar:1', name: 'bar', params: { color: 'test' } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-test',
            name: 'bar',
            params: { answer: 42, toBe: 'overrode' },
          },
          { key: 'baz', name: 'baz' },
        ],
      },

      CommonActions.preload('bar', { answer: 42, something: 'else' }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42, color: 'test', something: 'else' },
      },
      { key: 'baz', name: 'baz' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-existing',
            name: 'bar',
            params: { answer: 42, toBe: 'notMerged' },
          },
          { key: 'baz', name: 'baz' },
        ],
      },

      CommonActions.preload('bar', { answer: 43 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    // Different id ⇒ a new preloaded route is appended to the inactive tail.
    routes: [
      {
        key: 'bar-existing',
        name: 'bar',
        params: { answer: 42, toBe: 'notMerged' },
      },
      { key: 'baz', name: 'baz' },
      { key: 'root:bar:1', name: 'bar', params: { answer: 43, color: 'test' } },
    ],
  });
});

test('uses preloaded route when pushing a route with the same name', () => {
  const router = StackRouter({});
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
          { key: 'bar-test', name: 'bar' },
          // Preloaded route lives in the inactive tail (position > index).
          { key: 'qux-some', name: 'qux' },
        ],
      },

      StackActions.push('qux'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    // The preloaded route is promoted, reusing its key (no remount).
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'qux-some', name: 'qux' },
    ],
  });
});

test('uses preloaded route when pushing a route with the same ID', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
      baz: { foo: 12 },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'qux-test',
            name: 'qux',
          },
          // Preloaded route in the inactive tail (position > index).
          {
            key: 'bar-test',
            params: {
              answer: 41,
            },
            name: 'bar',
          },
        ],
      },

      StackActions.push('bar', { answer: 41 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux' },
      {
        key: 'bar-test',
        params: {
          color: 'test',
          answer: 41,
        },
        name: 'bar',
      },
    ],
  });
});

test('does not use preloaded route when pushing a route with different ID', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
      baz: { foo: 12 },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'qux-test',
            name: 'qux',
          },
          // Preloaded route in the inactive tail (position > index).
          {
            key: 'bar-some',
            params: {
              answer: 42,
              toBe: 'notMerged',
            },
            name: 'bar',
          },
        ],
      },

      StackActions.push('bar', { answer: 41 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    // Different id ⇒ a fresh route is pushed; the preloaded route stays in the tail.
    routes: [
      { key: 'qux-test', name: 'qux' },
      {
        key: 'root:bar:1',
        params: {
          color: 'test',
          answer: 41,
        },
        name: 'bar',
      },
      {
        key: 'bar-some',
        params: {
          answer: 42,
          toBe: 'notMerged',
        },
        name: 'bar',
      },
    ],
  });
});

test('uses preloaded route when replacing current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          // Preloaded route in the inactive tail (position > index).
          { key: 'bar-preloaded', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.replace('bar'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 42 },
      },
    ],
  });
});

test('uses preloaded route with the same ID when replacing current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          // Preloaded route in the inactive tail (position > index).
          { key: 'bar-preloaded', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.replace('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 42 },
      },
    ],
  });
});

test('does not use preloaded route with different ID when replacing current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          // Preloaded route in the inactive tail (position > index).
          { key: 'bar-preloaded', name: 'bar', params: { answer: 99 } },
        ],
      },
      StackActions.popTo('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    // Different id ⇒ a fresh route is added; the preloaded route stays in the inactive tail.
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'root:bar:1',
        name: 'bar',
        params: { color: 'test', answer: 42 },
      },
      { key: 'bar-preloaded', name: 'bar', params: { answer: 99 } },
    ],
  });
});

test('uses preloaded route with the same name when popTo replaces current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          // Preloaded route in the inactive tail (position > index).
          { key: 'bar-preloaded', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.popTo('bar'),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 42 },
      },
    ],
  });
});

test('uses preloaded route with the same ID when popTo replaces current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          // Preloaded route in the inactive tail (position > index).
          { key: 'bar-preloaded', name: 'bar', params: { answer: 42 } },
        ],
      },
      StackActions.popTo('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 42 },
      },
    ],
  });
});

test('does not use preloaded route with different ID when popTo replaces current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          // Preloaded route in the inactive tail (position > index).
          { key: 'bar-preloaded', name: 'bar', params: { answer: 99 } },
        ],
      },
      StackActions.popTo('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    // Different id ⇒ a fresh route is added; the preloaded route stays in the inactive tail.
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'root:bar:1',
        name: 'bar',
        params: { color: 'test', answer: 42 },
      },
      { key: 'bar-preloaded', name: 'bar', params: { answer: 99 } },
    ],
  });
});

// --- payload.state subtree insertion (Step 4) -------------------------------------------------
// The wire (Step 5) hands the create/enter action a complete subtree for the created route's
// not-yet-mounted child navigator; the router attaches it verbatim to that route's `.state`, but
// only when the route is a fresh identity (a newly-minted key) — never onto a reused/live/preloaded
// route, which already carries its own complete subtree.

test('navigate attaches payload.state to the freshly created route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const subtree = {
    stale: false as const,
    key: 'root:qux:0',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:qux:0:inner:0', name: 'inner' }],
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate({ name: 'qux', params: { answer: 42 }, state: subtree }),
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
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 }, state: subtree },
    ],
  });
});

test('push attaches payload.state to the freshly pushed route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const subtree = {
    stale: false as const,
    key: 'root:baz:0',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:baz:0:inner:0', name: 'inner' }],
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      { type: 'PUSH', payload: { name: 'baz', state: subtree } },
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'root:baz:0', name: 'baz', state: subtree },
    ],
  });
});

test('duplicate-name push appends a fresh sibling with payload.state, keeping the live route intact', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const liveState = {
    stale: false as const,
    key: 'root:baz:0',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:baz:0:inner:0', name: 'inner' }],
  };
  const subtree = {
    stale: false as const,
    key: 'root:baz:1',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:baz:1:inner:0', name: 'inner' }],
  };

  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [{ key: 'root:baz:0', name: 'baz', state: liveState } as any],
    },
    { type: 'PUSH', payload: { name: 'baz', state: subtree } },
    options
  );

  // The live `baz` keeps its own subtree; the fresh sibling (new key) carries payload.state.
  expect(next!.routes).toEqual([
    { key: 'root:baz:0', name: 'baz', state: liveState },
    { key: 'root:baz:1', name: 'baz', state: subtree },
  ]);
});

test('push promoting a preloaded route keeps the preloaded subtree, ignoring payload.state', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const preloadedState = {
    stale: false as const,
    key: 'qux-some',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'qux-some:inner:0', name: 'inner' }],
  };
  const subtree = {
    stale: false as const,
    key: 'ignored',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'ignored:inner:0', name: 'inner' }],
  };

  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 0,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [
        { key: 'bar-test', name: 'bar' },
        // Preloaded route in the inactive tail (position > index).
        { key: 'qux-some', name: 'qux', state: preloadedState } as any,
      ],
    },
    { type: 'PUSH', payload: { name: 'qux', state: subtree } },
    options
  );

  const qux = next!.routes.find((r) => r.name === 'qux')!;
  expect(qux.key).toBe('qux-some');
  expect((qux as any).state).toBe(preloadedState);
});

test('replace attaches payload.state to the freshly created replacement route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const subtree = {
    stale: false as const,
    key: 'root:qux:0',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'root:qux:0:inner:0', name: 'inner' }],
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['foo', 'bar', 'baz', 'qux'],
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar' },
          { key: 'baz', name: 'baz' },
        ],
      },
      { type: 'REPLACE', payload: { name: 'qux', params: { answer: 42 }, state: subtree } },
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'root:qux:0', name: 'qux', params: { answer: 42 }, state: subtree },
      { key: 'baz', name: 'baz' },
    ],
  });
});

test('replace promoting a preloaded route keeps the preloaded subtree, ignoring payload.state', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const preloadedState = {
    stale: false as const,
    key: 'bar-preloaded',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'bar-preloaded:inner:0', name: 'inner' }],
  };
  const subtree = {
    stale: false as const,
    key: 'ignored',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'ignored:inner:0', name: 'inner' }],
  };

  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 1,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [
        { key: 'baz', name: 'baz' },
        { key: 'qux', name: 'qux' },
        // Preloaded route in the inactive tail (position > index).
        { key: 'bar-preloaded', name: 'bar', state: preloadedState } as any,
      ],
    },
    { type: 'REPLACE', payload: { name: 'bar', state: subtree } },
    options
  );

  const bar = next!.routes.find((r) => r.name === 'bar')!;
  expect(bar.key).toBe('bar-preloaded');
  expect((bar as any).state).toBe(preloadedState);
});

test('navigate reusing a live route does not clobber its existing state with payload.state', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const liveState = {
    stale: false as const,
    key: 'bar',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'bar:inner:0', name: 'inner' }],
  };
  const subtree = {
    stale: false as const,
    key: 'ignored',
    index: 0,
    routeNames: ['inner'],
    routes: [{ key: 'ignored:inner:0', name: 'inner' }],
  };

  const next = router.getStateForAction(
    {
      stale: false,
      key: 'root',
      index: 1,
      routeNames: ['baz', 'bar', 'qux'],
      routes: [
        { key: 'baz', name: 'baz' },
        { key: 'bar', name: 'bar', state: liveState } as any,
      ],
    },
    // Navigating to the already-focused `bar` reuses the live route (same identity).
    CommonActions.navigate({ name: 'bar', params: { x: 1 }, merge: true, state: subtree }),
    options
  );

  const bar = next!.routes.find((r) => r.name === 'bar')!;
  expect((bar as any).state).toBe(liveState);
});

test('attach throws in dev when the subtree key disagrees with the minted route key', () => {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    const router = StackRouter({});
    const options: RouterConfigOptions = {
      routeNames: ['baz', 'bar', 'qux'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    };

    // The router mints `root:qux:0` for the new route, but the subtree declares a different key —
    // a sign the emitter computed keys in isolation. The dev tripwire must catch it.
    const mismatchedSubtree = {
      stale: false as const,
      key: 'somewhere-else',
      index: 0,
      routeNames: ['inner'],
      routes: [{ key: 'somewhere-else:inner:0', name: 'inner' }],
    };

    expect(() =>
      router.getStateForAction(
        {
          stale: false,
          key: 'root',
          index: 0,
          routeNames: ['baz', 'bar', 'qux'],
          routes: [{ key: 'baz', name: 'baz' }],
        },
        CommonActions.navigate({ name: 'qux', state: mismatchedSubtree }),
        options
      )
    ).toThrow(/does not match its route key/);
  } finally {
    process.env.NODE_ENV = prev;
  }
});
