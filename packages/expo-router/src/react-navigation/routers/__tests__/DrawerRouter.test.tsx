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
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'baz-test' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
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
    history: [{ type: 'route', key: 'bar-test' }],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });
});

test('gets rehydrated state from partial state', () => {
  const router = DrawerRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {
      baz: { answer: 42 },
      qux: { name: 'Jane' },
    },
    routeGetIdList: {},
  };

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
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

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
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'baz-0' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

  expect(
    router.getRehydratedState(
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
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'qux-2' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

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
    history: [{ type: 'route', key: 'bar-test' }],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

  expect(
    router.getRehydratedState(
      {
        index: 1,
        history: [
          { type: 'route', key: 'bar-test' },
          { type: 'route', key: 'qux-test' },
          { type: 'route', key: 'foo-test' },
          { type: 'drawer', status: 'open' },
        ],
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
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'drawer', status: 'open' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'drawer', status: 'open' },
    ],
    default: 'closed',
    stale: false as const,
    type: 'drawer' as const,
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('handles navigate action', () => {
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
        type: 'drawer',
        preloadedRouteKeys: [],
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz', params: { color: 'tomato' } },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
        default: 'closed',
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'baz' }],
    default: 'closed',
  });
});

test('handles navigate action with open drawer', () => {
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
        type: 'drawer',
        preloadedRouteKeys: [],
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [
          { type: 'route', key: 'bar' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'baz' }],
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
        type: 'drawer',
        preloadedRouteKeys: [],
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
        default: 'closed',
      },
      DrawerActions.openDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
    default: 'closed',
  });

  const state: DrawerNavigationState<ParamListBase> = {
    stale: false as const,
    type: 'drawer' as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
    default: 'closed',
  };

  expect(
    router.getStateForAction(state, DrawerActions.openDrawer(), options)
  ).toBe(state);
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
        type: 'drawer',
        preloadedRouteKeys: [],
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [
          { type: 'route', key: 'bar' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
      },
      DrawerActions.closeDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }],
    default: 'closed',
  });

  const state: DrawerNavigationState<ParamListBase> = {
    stale: false as const,
    type: 'drawer' as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'route', key: 'baz' },
    ],
    default: 'closed',
  };

  expect(
    router.getStateForAction(state, DrawerActions.closeDrawer(), options)
  ).toBe(state);
});

test('handles toggle drawer action', () => {
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
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        preloadedRouteKeys: [],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [
          { type: 'route', key: 'bar' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
      },
      DrawerActions.toggleDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'bar' }],
    default: 'closed',
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'drawer',
        preloadedRouteKeys: [],
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
        default: 'closed',
      },
      DrawerActions.toggleDrawer(),
      options
    )
  ).toEqual({
    stale: false,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
    default: 'closed',
  });
});

test('updates history on focus change with backBehavior: history', () => {
  const router = DrawerRouter({ backBehavior: 'history' });

  let state: DrawerNavigationState<ParamListBase> = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    default: 'closed',
    stale: false as const,
    type: 'drawer' as const,
  };

  state = router.getStateForRouteFocus(state, 'bar-0');

  expect(state.history).toEqual([{ type: 'route', key: 'bar-0' }]);

  state = router.getStateForRouteFocus(state, 'baz-0');

  expect(state.history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForRouteFocus(state, 'qux-0');

  expect(state.history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);

  state = router.getStateForRouteFocus(state, 'baz-0');

  expect(state.history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'baz-0' },
  ]);
});

test('updates history on focus change with backBehavior: fullHistory', () => {
  const router = DrawerRouter({ backBehavior: 'fullHistory' });

  let state: DrawerNavigationState<ParamListBase> = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['baz', 'bar'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    default: 'closed',
    stale: false as const,
    type: 'drawer' as const,
  };

  state = router.getStateForRouteFocus(state, 'bar-0');

  expect(state.history).toEqual([{ type: 'route', key: 'bar-0' }]);

  state = router.getStateForRouteFocus(state, 'baz-0');

  expect(state.history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
  ]);

  state = router.getStateForRouteFocus(state, 'qux-0');

  expect(state.history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
    { type: 'route', key: 'qux-0', params: { name: 'Jane' } },
  ]);

  state = router.getStateForRouteFocus(state, 'baz-0');

  expect(state.history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
    { type: 'route', key: 'qux-0', params: { name: 'Jane' } },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
  ]);
});

test('closes drawer on focus change with backBehavior: history', () => {
  const router = DrawerRouter({ backBehavior: 'history' });

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
        history: [{ type: 'route', key: 'bar-0' }],
        default: 'closed',
        stale: false,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
        stale: false,
        type: 'drawer',
      },
      'bar-0'
    )
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
        stale: false,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });
});

test('closes drawer on focus change with backBehavior: fullHistory', () => {
  const router = DrawerRouter({ backBehavior: 'fullHistory' });

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
        history: [{ type: 'route', key: 'bar-0' }],
        default: 'closed',
        stale: false,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
        stale: false,
        type: 'drawer',
      },
      'bar-0'
    )
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        default: 'closed',
        stale: false,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    default: 'closed',
    stale: false,
    type: 'drawer',
  });
});
