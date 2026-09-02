import { describe, expect, jest, test } from '@jest/globals';

import { createInitialState } from '../../core/createInitialState';
import {
  CommonActions,
  DrawerActions,
  type DrawerNavigationState,
  DrawerRouter,
  type ParamListBase,
  type RouterConfigOptions,
  TabActions,
} from '../index';

const options: RouterConfigOptions = {
  routeNames: ['one', 'two', 'three'],
  routeGetIdList: {},
};

const state = (
  names: string[] = ['one'],
  index = 0,
  extra: Partial<DrawerNavigationState<ParamListBase>> = {}
): DrawerNavigationState<ParamListBase> => ({
  stale: false,
  type: 'drawer',
  key: 'drawer',
  routeKeySeq: 0,
  routeNames: options.routeNames,
  routes: names.map((name) => ({ name, key: `${name}-key` })),
  index,
  ...extra,
});

describe('drawer status', () => {
  test('open, close and toggle use drawerStatus instead of history', () => {
    const router = DrawerRouter({});
    let next = router.getStateForAction(state(), DrawerActions.openDrawer(), options)!.state;
    expect(next.drawerStatus).toBe('open');
    expect(next.history).toBeUndefined();

    next = router.getStateForAction(next, DrawerActions.toggleDrawer(), options)!.state;
    expect(next.drawerStatus).toBeUndefined();
    next = router.getStateForAction(next, DrawerActions.closeDrawer(), options)!.state;
    expect(next.drawerStatus).toBeUndefined();
  });

  test('absent status means the configured open default for close, open and toggle', () => {
    const router = DrawerRouter({ defaultStatus: 'open' });
    const closed = router.getStateForAction(state(), DrawerActions.closeDrawer(), options)!.state;
    expect(closed.drawerStatus).toBe('closed');
    const open = router.getStateForAction(closed, DrawerActions.openDrawer(), options)!.state;
    expect(open.drawerStatus).toBeUndefined();
    const toggled = router.getStateForAction(open, DrawerActions.toggleDrawer(), options)!.state;
    expect(toggled.drawerStatus).toBe('closed');
  });

  test('navigation to another route resets status to default', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const next = router.getStateForAction(
      state(['one', 'two'], 0, { drawerStatus: 'open' }),
      TabActions.jumpTo('two'),
      options
    )!.state;
    expect(next.drawerStatus).toBeUndefined();
    expect(next.routes[next.index]?.name).toBe('two');
  });

  test('navigation to the focused route preserves status', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const next = router.getStateForAction(
      state(['one'], 0, { drawerStatus: 'open' }),
      CommonActions.setParams({ value: 1 }),
      options
    )!.state;
    expect(next.drawerStatus).toBe('open');
  });

  test('route focus closes the drawer', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    const current = state(['one', 'two'], 0, { drawerStatus: 'open' });
    expect(router.getStateForRouteFocus(current, 'one-key').drawerStatus).toBeUndefined();
    expect(router.getStateForRouteFocus(current, 'two-key').drawerStatus).toBeUndefined();
  });
});

describe('back behavior', () => {
  test.each(['firstRoute', 'initialRoute', 'order', 'history', 'fullHistory', 'none'] as const)(
    'closes the drawer before delegating with %s',
    (backBehavior) => {
      const router = DrawerRouter({ backBehavior, initialRouteName: 'one' });
      const current = state(['one', 'two'], 1, {
        drawerStatus: 'open',
        ...(backBehavior === 'fullHistory'
          ? {
              history: [
                { type: 'route' as const, key: 'one-key' },
                { type: 'route' as const, key: 'two-key' },
              ],
            }
          : undefined),
      });
      const closed = router.getStateForAction(current, CommonActions.goBack(), options)!.state;
      expect(closed.drawerStatus).toBeUndefined();
      expect(closed.index).toBe(1);

      const backed = router.getStateForAction(closed, CommonActions.goBack(), options);
      if (backBehavior === 'none') {
        expect(backed).toBeNull();
      } else {
        expect(backed?.state.index).toBe(0);
      }
    }
  );
});

describe('history migration', () => {
  test('strips legacy drawer entries and keeps route entries in fullHistory', () => {
    const legacy = state(['one'], 0, {
      history: [
        { type: 'route', key: 'one-key' },
        // Persisted states may still contain the old drawer entry shape.
        { type: 'drawer', status: 'open' } as never,
      ],
    });
    const next = DrawerRouter({ backBehavior: 'fullHistory' }).getStateForAction(
      legacy,
      CommonActions.setParams({ value: 1 }),
      options
    )!.state;
    expect(next.history).toEqual([{ type: 'route', key: 'one-key', params: { value: 1 } }]);
  });

  test('strips all history outside fullHistory', () => {
    const next = DrawerRouter({ backBehavior: 'history' }).getStateForAction(
      state(['one'], 0, { history: [{ type: 'route', key: 'one-key' }] }),
      DrawerActions.openDrawer(),
      options
    )!.state;
    expect(next.history).toBeUndefined();
    expect(next.drawerStatus).toBe('open');
  });

  test('preserves drawerStatus during route-name reconciliation and preload', () => {
    const router = DrawerRouter({ backBehavior: 'history' });
    let next = router.getStateForAction(
      state(['one'], 0, { drawerStatus: 'open' }),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['one', 'two'] } },
      { ...options, routeNames: ['one', 'two'] }
    )!.state;
    next = router.getStateForAction(next, CommonActions.preload('two'), options)!.state;
    expect(next.drawerStatus).toBe('open');
  });
});

test('actions return drawer metadata for state without router metadata', () => {
  const router = DrawerRouter({});
  const actionOptions: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const createState = (): DrawerNavigationState<ParamListBase> => ({
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 1,
    routeNames: actionOptions.routeNames,
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  });
  const resetState = createState();
  const actions = [
    DrawerActions.jumpTo('bar'),
    DrawerActions.openDrawer(),
    CommonActions.goBack(),
    CommonActions.reset({ ...resetState, index: 0, routes: [resetState.routes[0]!] }),
  ];

  for (const action of actions) {
    const result = router.getStateForAction(createState(), action, actionOptions);
    expect(result?.state.type).toBe('drawer');
    expect(result?.state.history).toBeUndefined();
  }
});

test('route focus returns drawer metadata for state without router metadata', () => {
  const current: DrawerNavigationState<ParamListBase> = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['bar', 'baz'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  };

  expect(DrawerRouter({}).getStateForRouteFocus(current, 'baz')).toMatchObject({
    type: 'drawer',
    index: 1,
  });
  expect(DrawerRouter({}).getStateForRouteFocus(current, 'baz').history).toBeUndefined();
});

test('warns and ignores a partial RESET state', () => {
  const current: DrawerNavigationState<ParamListBase> = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['bar'],
    routes: [{ key: 'bar', name: 'bar' }],
  };
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const result = DrawerRouter({}).getStateForAction(
    current,
    CommonActions.reset({ routes: [{ name: 'bar' }] }),
    { routeNames: ['bar'], routeGetIdList: {} }
  );

  expect(result).toBeNull();
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('The RESET action payload must contain a complete navigation state.')
  );
  warn.mockRestore();
});

test('keeps drawer status when the active route is removed', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const routeOptions: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const initialState = createInitialState<DrawerNavigationState<ParamListBase>>({
    ...routeOptions,
    parentChain: 'test',
  });
  const openState = router.getStateForAction(
    initialState,
    DrawerActions.openDrawer(),
    routeOptions
  )!.state;

  const result = router.getStateForAction(
    openState,
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['baz'] } },
    { ...routeOptions, routeNames: ['baz'] }
  );

  expect(result?.state).toEqual({
    stale: false,
    routeKeySeq: 2,
    type: 'drawer',
    key: 'navigator:test',
    index: 0,
    routeNames: ['baz'],
    routes: [{ key: 'baz:test-1', name: 'baz' }],
    drawerStatus: 'open',
  });
});

test('PRELOAD keeps ordered routes and drawer status', () => {
  const router = DrawerRouter({ backBehavior: 'order' });
  const routeOptions: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  const focusedState: DrawerNavigationState<ParamListBase> = {
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
    key: 'navigator:drawer',
    index: 0,
    routeNames: routeOptions.routeNames,
    routes: [{ key: 'qux-key', name: 'qux' }],
    drawerStatus: 'open',
  };

  const result = router.getStateForAction(focusedState, CommonActions.preload('baz'), routeOptions);

  expect(result?.state).toEqual({
    stale: false,
    routeKeySeq: 1,
    type: 'drawer',
    key: 'navigator:drawer',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'baz:drawer-0', name: 'baz' },
      { key: 'qux-key', name: 'qux' },
    ],
    drawerStatus: 'open',
  });
});

test('handles navigate action', () => {
  const router = DrawerRouter({});
  const routeOptions: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz', params: { color: 'tomato' } },
          { key: 'bar', name: 'bar' },
        ],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      routeOptions
    )?.state
  ).toEqual({
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
  });
});

test('handles navigate action with open drawer', () => {
  const router = DrawerRouter({});
  const routeOptions: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };

  const result = router.getStateForAction(
    {
      stale: false,
      routeKeySeq: 0,
      type: 'drawer',
      key: 'root',
      index: 1,
      routeNames: ['baz', 'bar'],
      routes: [
        { key: 'baz', name: 'baz' },
        { key: 'bar', name: 'bar' },
      ],
      drawerStatus: 'open',
    },
    CommonActions.navigate('baz', { answer: 42 }),
    routeOptions
  );

  expect(result?.state).toEqual({
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
  });
  expect(result?.affectedRouteKey).toBe('baz');
});

test('attaches trusted state while closing the drawer', () => {
  const router = DrawerRouter({});
  const routeOptions: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };
  const childState = { routes: [{ name: 'child' }], __internal__routerActionState: true as const };

  const result = router.getStateForAction(
    {
      stale: false,
      routeKeySeq: 0,
      type: 'drawer',
      key: 'root',
      index: 1,
      routeNames: ['baz', 'bar'],
      routes: [
        { key: 'baz', name: 'baz' },
        { key: 'bar', name: 'bar' },
      ],
      drawerStatus: 'open',
    },
    {
      type: 'NAVIGATE',
      payload: { name: 'baz', state: childState },
    },
    routeOptions
  );

  expect(result?.state.routes[0]?.state).toEqual({ routes: [{ name: 'child' }] });
  expect(result?.state.drawerStatus).toBeUndefined();
});

test('closes open drawer on replace with backBehavior: fullHistory', () => {
  const router = DrawerRouter({ backBehavior: 'fullHistory' });
  const routeOptions: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
        drawerStatus: 'open',
      },
      DrawerActions.replace('baz'),
      routeOptions
    )?.state
  ).toEqual({
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'baz' }],
  });
});

test('handles open drawer action and reports the focused route', () => {
  const router = DrawerRouter({});
  const routeOptions: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };
  const current = state(['baz', 'bar'], 1);

  const result = router.getStateForAction(current, DrawerActions.openDrawer(), routeOptions);

  expect(result?.state.drawerStatus).toBe('open');
  expect(result?.state.history).toBeUndefined();
  expect(result?.affectedRouteKey).toBe('bar-key');
  expect(
    router.getStateForAction(result!.state, DrawerActions.openDrawer(), routeOptions)?.state
  ).toBe(result?.state);
});

test('handles close drawer action and reports the focused route', () => {
  const router = DrawerRouter({});
  const routeOptions: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };
  const current = state(['baz', 'bar'], 1, { drawerStatus: 'open' });

  const result = router.getStateForAction(current, DrawerActions.closeDrawer(), routeOptions);

  expect(result?.state.drawerStatus).toBeUndefined();
  expect(result?.state.history).toBeUndefined();
  expect(result?.affectedRouteKey).toBe('bar-key');
  expect(
    router.getStateForAction(result!.state, DrawerActions.closeDrawer(), routeOptions)?.state
  ).toBe(result?.state);
});

test('updates route order on focus change with backBehavior: history', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  let current = state(['bar', 'baz', 'qux']);

  current = router.getStateForRouteFocus(current, 'bar-key');
  expect(current.routes.map((route) => route.name)).toEqual(['bar', 'baz', 'qux']);
  expect(current.index).toBe(0);

  current = router.getStateForRouteFocus(current, 'baz-key');
  expect(current.routes.map((route) => route.name)).toEqual(['bar', 'baz', 'qux']);
  expect(current.index).toBe(1);

  current = router.getStateForRouteFocus(current, 'qux-key');
  expect(current.routes.map((route) => route.name)).toEqual(['bar', 'baz', 'qux']);
  expect(current.index).toBe(2);

  current = router.getStateForRouteFocus(current, 'baz-key');
  expect(current.routes.map((route) => route.name)).toEqual(['bar', 'qux', 'baz']);
  expect(current.index).toBe(2);
  expect(current.history).toBeUndefined();
});

test('updates history on focus change with backBehavior: fullHistory', () => {
  const router = DrawerRouter({ backBehavior: 'fullHistory' });
  let current = state(['bar', 'baz', 'qux'], 0, {
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz', params: { answer: 42 } },
      { key: 'qux-key', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-key' }],
  });

  current = router.getStateForRouteFocus(current, 'bar-key');
  expect(current.history).toEqual([{ type: 'route', key: 'bar-key' }]);

  current = router.getStateForRouteFocus(current, 'baz-key');
  expect(current.history).toEqual([
    { type: 'route', key: 'bar-key' },
    { type: 'route', key: 'baz-key', params: { answer: 42 } },
  ]);

  current = router.getStateForRouteFocus(current, 'qux-key');
  expect(current.history).toEqual([
    { type: 'route', key: 'bar-key' },
    { type: 'route', key: 'baz-key', params: { answer: 42 } },
    { type: 'route', key: 'qux-key', params: { name: 'Jane' } },
  ]);

  current = router.getStateForRouteFocus(current, 'baz-key');
  expect(current.history).toEqual([
    { type: 'route', key: 'bar-key' },
    { type: 'route', key: 'baz-key', params: { answer: 42 } },
    { type: 'route', key: 'qux-key', params: { name: 'Jane' } },
    { type: 'route', key: 'baz-key', params: { answer: 42 } },
  ]);
});

test('closes drawer on focus change with backBehavior: history', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const current = state(['bar', 'baz', 'qux'], 0, { drawerStatus: 'open' });

  expect(router.getStateForRouteFocus(current, 'bar-key')).toEqual({
    ...current,
    drawerStatus: undefined,
  });
  expect(router.getStateForRouteFocus(current, 'baz-key')).toEqual({
    ...current,
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz' },
      { key: 'qux-key', name: 'qux' },
    ],
    index: 1,
    drawerStatus: undefined,
  });
});

test('closes drawer on focus change with backBehavior: fullHistory', () => {
  const router = DrawerRouter({ backBehavior: 'fullHistory' });
  const current = state(['bar', 'baz', 'qux'], 0, {
    history: [{ type: 'route', key: 'bar-key' }],
    drawerStatus: 'open',
  });

  expect(router.getStateForRouteFocus(current, 'bar-key')).toEqual({
    ...current,
    drawerStatus: undefined,
  });
  expect(router.getStateForRouteFocus(current, 'baz-key')).toEqual({
    ...current,
    index: 1,
    history: [
      { type: 'route', key: 'bar-key' },
      { type: 'route', key: 'baz-key' },
    ],
    drawerStatus: undefined,
  });
});
