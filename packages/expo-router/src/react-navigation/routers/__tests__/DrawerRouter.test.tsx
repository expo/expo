import { expect, test } from '@jest/globals';

import {
  CommonActions,
  type DrawerNavigationState,
  DrawerRouter,
  type ParamListBase,
  type RouterConfigOptions,
  StackActions,
  TabActions,
} from '..';

const names = (state: { routes: { name: string }[] }) => state.routes.map((route) => route.name);

// The drawer's open/closed status lives in the drawer navigator's local React state, so the router
// delegates entirely to the tab router (no dedicated drawer key). In the new model `routes` is a
// SUBSET of `routeNames` (presence is the loaded signal) and there is no `preloadedRouteKeys` field.

test('gets initial state materializing the anchor and the initial route with initialRouteName', () => {
  const router = DrawerRouter({ initialRouteName: 'baz' });

  // firstRoute (default) anchor = first declared (bar), focused = baz -> subset [bar, baz] index 1.
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

test('gets initial state materializing only the focused route without initialRouteName', () => {
  const router = DrawerRouter({});

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

test('defaultStatus does not affect navigation state', () => {
  const router = DrawerRouter({ defaultStatus: 'open' });

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz'],
      routeParamList: {},
      parentRouteKey: undefined,
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: '@',
    routeNames: ['bar', 'baz'],
    routes: [{ key: '@:bar:0', name: 'bar' }],
    stale: false,
  });
});

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
    router.getRehydratedState(
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

  // Empty routes -> materialize the first declared route, index 0.
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
    stale: false as const,
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

test('getStateForRouteFocus focuses the route in place', () => {
  const router = DrawerRouter({});

  // Default `firstRoute` back behavior: present `routes` stay in declaration order and focus
  // just moves to the route's index.
  expect(
    router.getStateForRouteFocus(
      {
        index: 0,
        key: 'drawer-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        stale: false,
      },
      'baz-0'
    )
  ).toEqual({
    index: 1,
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
    key: 'drawer-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'drawer-test:bar:0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
    ],
  });
});
