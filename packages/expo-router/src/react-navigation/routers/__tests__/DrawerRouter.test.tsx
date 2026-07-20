import { expect, test } from '@jest/globals';

import {
  CommonActions,
  type DrawerNavigationState,
  DrawerRouter,
  focusChild,
  type NavigationState,
  type ParamListBase,
  type PartialState,
  RECONCILE_ROUTE_NAMES,
  type ReconcileRouteNamesAction,
  type RouterConfigOptions,
  StackActions,
  TabActions,
} from '..';

const names = (state: { routes: { name: string }[] }) => state.routes.map((route) => route.name);

type ReconcileConfig = RouterConfigOptions & { routeKeyChanges?: string[] };

// Route-names reconciliation moved into `getStateForAction` as a `RECONCILE_ROUTE_NAMES` case. The
// former `getRehydratedState` is now its unhandled-state-restore branch, which fires only when the
// committed routes are disjoint from the new route names — so we reduce against a synthetic committed
// state with a single absent route. On this branch the drawerStatus comes from the restored unhandled
// state (default when absent), so the synthetic committed state's own status never leaks through.
function restoreUnhandled(
  router: ReturnType<typeof DrawerRouter>,
  unhandledState: PartialState<NavigationState> | NavigationState,
  config: ReconcileConfig
) {
  const committed: DrawerNavigationState<ParamListBase> = {
    stale: false,
    key: '__committed__',
    index: 0,
    routeNames: ['__absent__'],
    routes: [{ key: '__absent__', name: '__absent__' }],
    drawerStatus: 'closed',
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
  );
}

// The drawer's open/closed status lives in the drawer navigator's local React state, so the router
// delegates entirely to the tab router (no dedicated drawer key). In the new model `routes` is a
// SUBSET of `routeNames` (presence is the loaded signal) and there is no `preloadedRouteKeys` field.

test('rehydrates preserving the persisted subset and appending the anchor', () => {
  const router = DrawerRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Persisted subset [bar, qux], focused index 1 (qux). firstRoute keeps the anchor (bar)
  // leading; baz is NOT materialized (never loaded) -> [bar, qux] focused qux index 1.
  expect(
    restoreUnhandled(
    router,
      {
        index: 1,
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-1', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    drawerStatus: 'closed',
    index: 1,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });
});

test('rehydrates focusing the previously-focused route and falling back to 0', () => {
  const router = DrawerRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // No index given -> focused falls back to the single persisted route 'baz'. firstRoute adds
  // the anchor 'bar' in front -> subset [bar, baz] index 1.
  expect(
    restoreUnhandled(
    router,
      {
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      options
    )
  ).toEqual({
    drawerStatus: 'closed',
    index: 1,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: '@:bar:0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
    ],
    stale: false,
  });

  // Empty routes -> materialize the first declared route, index 0.
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
    drawerStatus: 'closed',
    index: 0,
    key: '@',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: '@:bar:0', name: 'bar' }],
    stale: false,
  });
});

test('restores an already-complete unhandled state verbatim', () => {
  const router = DrawerRouter({});

  const state: DrawerNavigationState<ParamListBase> = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    drawerStatus: 'closed',
    stale: false as const,
  };

  // A complete unhandled state is returned by identity, drawerStatus and all.
  expect(
    restoreUnhandled(router, state, {
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('handles navigate action by focusing the target route in place', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // The drawer uses the default `firstRoute` back behavior, so present `routes` stay in
  // declaration order; navigating to baz just focuses it (index -> its position).
  expect(
    router.getStateForAction(
      {
        stale: false,
        drawerStatus: 'closed',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz', params: { color: 'tomato' } },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    drawerStatus: 'closed',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 }, path: undefined },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux' },
    ],
  });
});

test('GO_BACK delegates to the tab router', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Tab GO_BACK with backBehavior 'history' moves focus to the previous route (index - 1).
  // Routes are left untouched.
  expect(
    router.getStateForAction(
      {
        stale: false,
        drawerStatus: 'closed',
        key: 'root',
        index: 2,
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
      },
      CommonActions.goBack(),
      options
    )
  ).toEqual({
    stale: false,
    drawerStatus: 'closed',
    key: 'root',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
  });
});

test('GO_BACK closes an open drawer before delegating to tab history', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false,
    drawerStatus: 'open',
    key: 'root',
    index: 1,
    routeNames: ['bar', 'baz'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
    ],
  };

  const closed = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as DrawerNavigationState<ParamListBase>;

  expect(closed).toEqual({ ...state, drawerStatus: 'closed' });
  expect(router.getStateForAction(closed!, CommonActions.goBack(), options)).toEqual({
    ...state,
    drawerStatus: 'closed',
    index: 0,
  });
});

test('handles drawer open, close, and toggle actions', () => {
  const router = DrawerRouter({});
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false,
    drawerStatus: 'closed',
    key: '@',
    index: 0,
    routeNames: ['bar'],
    routes: [{ key: '@:bar:0', name: 'bar' }],
  };
  const options: RouterConfigOptions = {
    routeNames: ['bar'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  const open = router.getStateForAction(
    state,
    { type: 'OPEN_DRAWER' },
    options
  )! as DrawerNavigationState<ParamListBase>;
  expect(open.drawerStatus).toBe('open');
  expect(router.getStateForAction(open, { type: 'TOGGLE_DRAWER' }, options)!.drawerStatus).toBe(
    'closed'
  );
  expect(router.getStateForAction(open, { type: 'CLOSE_DRAWER' }, options)!.drawerStatus).toBe(
    'closed'
  );
});

test('REPLACE drops the replaced route from the back stack (inherited from the tab router)', () => {
  const router = DrawerRouter({ backBehavior: 'firstRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['one', 'two'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Focus one at index 0. replace two: JUMP_TO two -> firstRoute [one, two] index 1,
  // then prune the replaced one past focused -> [two, one] index 0. GO_BACK -> null.
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false,
    key: 'root',
    index: 0,
    routeNames: ['one', 'two'],
    routes: [
      { key: 'one', name: 'one' },
      { key: 'two', name: 'two' },
    ],
    drawerStatus: 'closed',
  };

  const replaced = router.getStateForAction(
    state,
    // REPLACE isn't part of the drawer action union; the tab wrapper handles it at runtime.
    StackActions.replace('two') as unknown as Parameters<typeof router.getStateForAction>[1],
    options
  ) as DrawerNavigationState<ParamListBase>;
  expect(names(replaced)).toEqual(['two', 'one']);
  expect(replaced.index).toBe(0);

  expect(router.getStateForAction(replaced, CommonActions.goBack(), options)).toBeNull();
});

test('FOCUS_CHILD focuses the route in place', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Default `firstRoute` back behavior: present `routes` stay in declaration order and focus
  // just moves to the route's index.
  expect(
    router.getStateForAction(
      {
        index: 0,
        drawerStatus: 'closed',
        key: 'drawer-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        stale: false,
      },
      focusChild('baz-0') as unknown as Parameters<typeof router.getStateForAction>[1],
      options
    )
  ).toEqual({
    index: 1,
    drawerStatus: 'closed',
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    stale: false,
  });
});

// Compiler-seeded complete states omit `drawerStatus` because navigator kind lives only in React,
// so the router must treat an absent field as the effective default rather than a distinct value.
describe('missing drawerStatus (compiler-seeded state)', () => {
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  test('GO_BACK with no status delegates straight to positional tab back', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const state = {
      stale: false as const,
      key: 'root',
      index: 1,
      routeNames: ['bar', 'baz'],
      routes: [
        { key: 'bar-0', name: 'bar' },
        { key: 'baz-0', name: 'baz' },
      ],
    } as unknown as DrawerNavigationState<ParamListBase>;

    expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
      ...state,
      drawerStatus: 'closed',
      index: 0,
    });
  });

  test('CLOSE_DRAWER at the effective default is a no-op', () => {
    const router = DrawerRouter({});
    const state = {
      stale: false as const,
      key: 'root',
      index: 0,
      routeNames: ['bar', 'baz'],
      routes: [{ key: 'bar-0', name: 'bar' }],
    } as unknown as DrawerNavigationState<ParamListBase>;

    expect(router.getStateForAction(state, { type: 'CLOSE_DRAWER' }, options)).toBe(state);
  });

  test('TOGGLE_DRAWER flips from the effective default', () => {
    const closedDefault = DrawerRouter({});
    const openDefault = DrawerRouter({ defaultStatus: 'open' });
    const state = {
      stale: false as const,
      key: 'root',
      index: 0,
      routeNames: ['bar', 'baz'],
      routes: [{ key: 'bar-0', name: 'bar' }],
    } as unknown as DrawerNavigationState<ParamListBase>;

    expect(closedDefault.getStateForAction(state, { type: 'TOGGLE_DRAWER' }, options)!.drawerStatus).toBe(
      'open'
    );
    expect(openDefault.getStateForAction(state, { type: 'TOGGLE_DRAWER' }, options)!.drawerStatus).toBe(
      'closed'
    );
  });

  test('OPEN_DRAWER at the effective open default is a no-op', () => {
    const router = DrawerRouter({ defaultStatus: 'open' });
    const state = {
      stale: false as const,
      key: 'root',
      index: 0,
      routeNames: ['bar', 'baz'],
      routes: [{ key: 'bar-0', name: 'bar' }],
    } as unknown as DrawerNavigationState<ParamListBase>;

    expect(router.getStateForAction(state, { type: 'OPEN_DRAWER' }, options)).toBe(state);
  });
});

test('front-preloads the implicit anchor at the front (delegating to the tab router)', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    parentRouteKey: undefined,
    routeGetIdList: {},
  };

  // Deep-linked to baz; the firstRoute anchor (bar) is absent. Front-preload inserts it at index 0
  // and bumps the index so baz stays focused, keeping the navigator's state key.
  expect(
    router.getStateForAction(
      {
        stale: false,
        drawerStatus: 'closed',
        key: 'drawer-test',
        index: 0,
        routeNames: ['bar', 'baz', 'qux'],
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      TabActions.frontPreload('bar'),
      options
    )
  ).toEqual({
    stale: false,
    drawerStatus: 'closed',
    key: 'drawer-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'drawer-test:bar:0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
    ],
  });
});
