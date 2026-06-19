import { expect, jest, test } from '@jest/globals';

import {
  CommonActions,
  DrawerActions,
  type DrawerNavigationState,
  DrawerRouter,
  type ParamListBase,
  type RouterConfigOptions,
} from '..';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

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
    history: [],
    default: 'closed',
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
    history: [],
    default: 'closed',
    stale: false,
  });
});

test('seeds an open drawer in initial state when defaultStatus is open', () => {
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
    history: [],
    default: 'open',
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
    history: [],
    default: 'closed',
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
    history: [],
    default: 'closed',
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
    history: [],
    default: 'closed',
    stale: false,
  });
});

test('rehydrates a persisted open drawer and drops route history entries', () => {
  const router = DrawerRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    routeGetIdList: {},
  };

  // The drawer entry in the persisted history restores an open drawer; the
  // returned history holds only the drawer entry.
  expect(
    router.getRehydratedState(
      {
        index: 0,
        history: [{ type: 'drawer', status: 'open' }],
        routes: [{ key: 'bar-0', name: 'bar' }],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'drawer', status: 'open' }],
    default: 'closed',
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
    history: [{ type: 'drawer', status: 'open' }],
    default: 'closed',
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
        history: [],
        default: 'closed',
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
    history: [],
    default: 'closed',
  });
});

test('handles navigate action with open drawer by closing it', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  // Focus starts on baz. The drawer's default `firstRoute` arranges the back stack
  // as [first, focused, ...rest], so navigating to qux gives [baz, qux, bar] with
  // qux focused at index 1. The focused route changed, so the open drawer is closed.
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
        history: [{ type: 'drawer', status: 'open' }],
        default: 'closed',
      },
      CommonActions.navigate('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'qux', name: 'qux', params: { answer: 42 }, path: undefined },
      { key: 'bar', name: 'bar' },
    ],
    history: [],
    default: 'closed',
  });
});

test('handles open drawer action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
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
        history: [],
        default: 'closed',
      },
      DrawerActions.openDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'drawer', status: 'open' }],
    default: 'closed',
  });

  // Opening an already-open drawer is a no-op (same reference returned).
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'drawer', status: 'open' }],
    default: 'closed',
  };

  expect(router.getStateForAction(state, DrawerActions.openDrawer(), options)).toBe(state);
});

test('handles close drawer action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
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
        history: [{ type: 'drawer', status: 'open' }],
        default: 'closed',
      },
      DrawerActions.closeDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [],
    default: 'closed',
  });

  // Closing an already-closed drawer is a no-op (same reference returned).
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [],
    default: 'closed',
  };

  expect(router.getStateForAction(state, DrawerActions.closeDrawer(), options)).toBe(state);
});

test('handles toggle drawer action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeParamList: {},
    routeGetIdList: {},
  };

  // Open → closed (drawer entry removed).
  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        preloadedRouteKeys: [],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'drawer', status: 'open' }],
        default: 'closed',
      },
      DrawerActions.toggleDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [],
    default: 'closed',
  });

  // Closed → open (drawer entry added).
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
        history: [],
        default: 'closed',
      },
      DrawerActions.toggleDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'drawer', status: 'open' }],
    default: 'closed',
  });
});

test('GO_BACK closes an open drawer without changing routes or index', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
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
        history: [{ type: 'drawer', status: 'open' }],
        default: 'closed',
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
    history: [],
    default: 'closed',
  });
});

test('GO_BACK delegates to the tab router when the drawer is closed', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  // No drawer entry → tab GO_BACK with backBehavior 'history' moves focus to the
  // previous route (index - 1). Routes are left untouched.
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
        history: [],
        default: 'closed',
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
    history: [],
    default: 'closed',
  });
});

test('getStateForRouteFocus focuses the route in place and closes the drawer', () => {
  const router = DrawerRouter({});

  // Default `firstRoute` back behavior: `routes` stays in declaration order, focus
  // just moves to the route's index, and the open drawer is closed.
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
        history: [{ type: 'drawer', status: 'open' }],
        default: 'closed',
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
    history: [],
    default: 'closed',
    stale: false,
  });
});
