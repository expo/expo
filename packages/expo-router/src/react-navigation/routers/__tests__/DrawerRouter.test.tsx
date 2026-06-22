import { expect, jest, test } from '@jest/globals';

import {
  CommonActions,
  type DrawerNavigationState,
  DrawerRouter,
  type ParamListBase,
  type RouterConfigOptions,
} from '..';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

// The drawer's open/closed status lives in the drawer navigator's local React state, so the
// router behaves like the tab router plus a `drawer-` key. These tests cover only navigation state.

test('gets initial state from route names and params with initialRouteName', () => {
  const router = DrawerRouter({ initialRouteName: 'baz' });

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
      routeGetIdList: {},
    })
  ).toEqual({
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });
});

test('gets initial state from route names and params without initialRouteName', () => {
  const router = DrawerRouter({});

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {
        baz: { answer: 42 },
        qux: { name: 'Jane' },
      },
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });
});

test('defaultStatus does not affect navigation state', () => {
  const router = DrawerRouter({ defaultStatus: 'open' });

  expect(
    router.getInitialState({
      routeNames: ['bar', 'baz'],
      routeParamList: {},
      routeGetIdList: {},
    })
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
    ],
    stale: false,
  });
});

test('rehydrates preserving the persisted route order and appending new tabs', () => {
  const router = DrawerRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    routeGetIdList: {},
  };

  // Persisted state focuses qux (index 1 of its own routes). baz is newly
  // declared, so it is appended at the end in declaration order.
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
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
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
    routeGetIdList: {},
  };

  // No index given → focused falls back to the persisted route 'baz'. The drawer's
  // default `firstRoute` arranges the back stack as [first, focused, ...rest], so
  // anchor 'bar' leads and 'baz' sits at index 1 (its persisted key is kept).
  expect(
    router.getRehydratedState(
      {
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });

  // Empty routes → everything rebuilt in declaration order, index falls back to 0.
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
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
  });
});

test("doesn't rehydrate state if it's not stale", () => {
  const router = DrawerRouter({});

  const state: DrawerNavigationState<ParamListBase> = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
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
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('handles navigate action by focusing the target route in place', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  // The drawer uses the default `firstRoute` back behavior, so `routes` stays in
  // declaration order; navigating to baz just focuses it (index → its position).
  expect(
    router.getStateForAction(
      {
        stale: false,
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
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
    routeGetIdList: {},
  };

  // Tab GO_BACK with backBehavior 'history' moves focus to the previous route
  // (index - 1). Routes are left untouched.
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
        routeNames: ['bar', 'baz', 'qux'],
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
  });
});

test('getStateForRouteFocus focuses the route in place', () => {
  const router = DrawerRouter({});

  // Default `firstRoute` back behavior: `routes` stays in declaration order and focus
  // just moves to the route's index.
  expect(
    router.getStateForRouteFocus(
      {
        index: 0,
        key: 'drawer-test',
        routeNames: ['bar', 'baz', 'qux'],
        preloadedRouteKeys: [],
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
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    stale: false,
  });
});
