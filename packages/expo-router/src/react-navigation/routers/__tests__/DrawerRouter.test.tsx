import { expect, jest, test } from '@jest/globals';

import {
  CommonActions,
  type DrawerActionType,
  DrawerActions,
  type DrawerNavigationState,
  DrawerRouter,
  type ParamListBase,
  type RouterConfigOptions,
} from '..';
import { createInitialState } from '../../core/createInitialState';

test('actions return drawer metadata for state without router metadata', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const createState = (): DrawerNavigationState<ParamListBase> => ({
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 1,
    routeNames: options.routeNames,
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
    const result = router.getStateForAction(createState(), action, options);
    expect(result?.state).toMatchObject({ type: 'drawer', history: expect.any(Array) });
  }
});

test('route focus returns drawer metadata for state without router metadata', () => {
  const state: DrawerNavigationState<ParamListBase> = {
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

  expect(DrawerRouter({}).getStateForRouteFocus(state, 'baz')).toMatchObject({
    type: 'drawer',
    history: expect.any(Array),
  });
});

test('warns and ignores a partial RESET state', () => {
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    index: 0,
    routeNames: ['bar'],
    routes: [{ key: 'bar', name: 'bar' }],
  };
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

  const result = DrawerRouter({}).getStateForAction(
    state,
    CommonActions.reset({ routes: [{ name: 'bar' }] }),
    { routeNames: ['bar'], routeGetIdList: {} }
  );

  expect(result).toBeNull();
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('The RESET action payload must contain a complete navigation state.')
  );
  warn.mockRestore();
});

type DrawerHistory = NonNullable<DrawerNavigationState<ParamListBase>['history']>;

const stateWithoutHistory = (): DrawerNavigationState<ParamListBase> => ({
  stale: false,
  routeKeySeq: 0,
  type: 'drawer',
  key: 'root',
  index: 0,
  routeNames: ['bar'],
  routes: [{ key: 'bar', name: 'bar' }],
});

const optionsWithoutHistory: RouterConfigOptions = {
  routeNames: ['bar'],
  routeGetIdList: {},
};

test.each<{ action: DrawerActionType; expectedHistory: DrawerHistory }>([
  {
    action: DrawerActions.openDrawer(),
    expectedHistory: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
  },
  {
    action: DrawerActions.toggleDrawer(),
    expectedHistory: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
  },
  {
    action: DrawerActions.closeDrawer(),
    expectedHistory: [{ type: 'route', key: 'bar' }],
  },
])('handles $action.type without history', ({ action, expectedHistory }) => {
  const router = DrawerRouter({});

  expect(
    router.getStateForAction(stateWithoutHistory(), action, optionsWithoutHistory)?.state.history
  ).toEqual(expectedHistory);
});

// With `defaultStatus: 'open'` the encoding is inverted: an open drawer is the absence of a
// history entry, so opening removes one and closing adds one.
test.each<{ action: DrawerActionType; expectedHistory: DrawerHistory }>([
  {
    action: DrawerActions.openDrawer(),
    expectedHistory: [{ type: 'route', key: 'bar' }],
  },
  {
    action: DrawerActions.toggleDrawer(),
    expectedHistory: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'closed' },
    ],
  },
  {
    action: DrawerActions.closeDrawer(),
    expectedHistory: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'closed' },
    ],
  },
])(
  'handles $action.type without history and defaultStatus: open',
  ({ action, expectedHistory }) => {
    const router = DrawerRouter({ defaultStatus: 'open' });

    expect(
      router.getStateForAction(stateWithoutHistory(), action, optionsWithoutHistory)?.state.history
    ).toEqual(expectedHistory);
  }
);

// `getRouteHistory` falls through its switch for `none`, so only the focused route is
// reconstructed. `firstRoute` would additionally prepend `bar` here.
test.each<{ action: DrawerActionType; expectedHistory: DrawerHistory }>([
  {
    action: DrawerActions.openDrawer(),
    expectedHistory: [
      { type: 'route', key: 'baz' },
      { type: 'drawer', status: 'open' },
    ],
  },
  {
    action: DrawerActions.closeDrawer(),
    expectedHistory: [{ type: 'route', key: 'baz' }],
  },
])('handles $action.type without history and backBehavior: none', ({ action, expectedHistory }) => {
  const router = DrawerRouter({ backBehavior: 'none' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state: DrawerNavigationState<ParamListBase> = {
    ...stateWithoutHistory(),
    index: 1,
    routeNames: options.routeNames,
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  };

  expect(router.getStateForAction(state, action, options)?.state.history).toEqual(expectedHistory);
});

test('preserves reconstructed history after closing the drawer', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state: DrawerNavigationState<ParamListBase> = {
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
    key: 'root',
    index: 1,
    routeNames: options.routeNames,
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  };

  const openState = router.getStateForAction(state, DrawerActions.openDrawer(), options)!.state;
  const closedState = router.getStateForAction(openState, CommonActions.goBack(), options)!.state;
  const result = router.getStateForAction(closedState, CommonActions.goBack(), options);

  expect(result?.state.routes[result.state.index ?? -1]?.name).toBe('bar');
});

test('preserves drawer status when route names change', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const initialState = createInitialState<DrawerNavigationState<ParamListBase>>({
    ...options,
    parentChain: 'test',
  });
  const openState = router.getStateForAction(
    initialState,
    DrawerActions.openDrawer(),
    options
  )!.state;

  const state = router.getStateForAction(
    openState,
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['baz', 'bar'] } },
    { ...options, routeNames: ['baz', 'bar'] }
  );

  expect(state!.state.history).toContainEqual({ type: 'drawer', status: 'open' });
});

test('restores route history without dropping drawer status when the active route is removed', () => {
  const router = DrawerRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const initialState = createInitialState<DrawerNavigationState<ParamListBase>>({
    ...options,
    parentChain: 'test',
  });
  const openState = router.getStateForAction(
    initialState,
    DrawerActions.openDrawer(),
    options
  )!.state;

  const state = router.getStateForAction(
    openState,
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['baz'] } },
    { ...options, routeNames: ['baz'] }
  );

  expect(state!.state.history).toEqual([
    { type: 'route', key: 'baz:test-1' },
    { type: 'drawer', status: 'open' },
  ]);
});

test('PRELOAD rebuilds route history without dropping drawer status', () => {
  const router = DrawerRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  const focusedState: DrawerNavigationState<ParamListBase> = {
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
    key: 'navigator:drawer',
    index: 0,
    routeNames: options.routeNames,
    routes: [{ key: 'qux-key', name: 'qux' }],
  };
  const openState = router.getStateForAction(
    focusedState,
    DrawerActions.openDrawer(),
    options
  )!.state;

  const state = router.getStateForAction(
    openState,
    { type: 'PRELOAD', payload: { name: 'baz' } },
    options
  );

  expect(state!.state.history).toEqual([
    { type: 'route', key: 'baz:drawer-0' },
    { type: 'route', key: 'qux-key' },
    { type: 'drawer', status: 'open' },
  ]);
});

test('handles navigate action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
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
        history: [{ type: 'route', key: 'bar' }],
      },
      CommonActions.navigate('baz', { answer: 42 }),
      options
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
    history: [{ type: 'route', key: 'baz' }],
  });
});

test('handles navigate action with open drawer', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
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
      history: [
        { type: 'route', key: 'bar' },
        { type: 'drawer', status: 'open' },
      ],
    },
    CommonActions.navigate('baz', { answer: 42 }),
    options
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
    history: [{ type: 'route', key: 'baz' }],
  });
  expect(result?.affectedRouteKey).toBe('baz');
});

test('attaches trusted state while closing the drawer', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
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
      history: [
        { type: 'route', key: 'bar' },
        { type: 'drawer', status: 'open' },
      ],
    },
    {
      type: 'NAVIGATE',
      payload: { name: 'baz', state: childState },
    },
    options
  );

  expect(result?.state.routes[0]?.state).toEqual({ routes: [{ name: 'child' }] });
  expect(result?.state.history).toEqual([{ type: 'route', key: 'baz' }]);
});

test('closes open drawer on replace with backBehavior: fullHistory', () => {
  const router = DrawerRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
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
        history: [
          { type: 'route', key: 'bar' },
          { type: 'drawer', status: 'open' },
        ],
      },
      DrawerActions.replace('baz'),
      options
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

test('handles open drawer action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
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
      history: [{ type: 'route', key: 'bar' }],
    },
    DrawerActions.openDrawer(),
    options
  );

  expect(result?.state).toEqual({
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
    history: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
  });
  expect(result?.affectedRouteKey).toBe('bar');

  const state: DrawerNavigationState<ParamListBase> = {
    stale: false as const,
    routeKeySeq: 0,
    type: 'drawer' as const,
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
  };

  expect(router.getStateForAction(state, DrawerActions.openDrawer(), options)?.state).toBe(state);
});

test('handles close drawer action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
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
      history: [
        { type: 'route', key: 'bar' },
        { type: 'drawer', status: 'open' },
      ],
    },
    DrawerActions.closeDrawer(),
    options
  );

  expect(result?.state).toEqual({
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
  });
  expect(result?.affectedRouteKey).toBe('bar');

  const state: DrawerNavigationState<ParamListBase> = {
    stale: false as const,
    routeKeySeq: 0,
    type: 'drawer' as const,
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'bar' },
      { type: 'route', key: 'baz' },
    ],
  };

  expect(router.getStateForAction(state, DrawerActions.closeDrawer(), options)?.state).toBe(state);
});

test('handles toggle drawer action', () => {
  const router = DrawerRouter({});
  const options: RouterConfigOptions = {
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
        history: [
          { type: 'route', key: 'bar' },
          { type: 'drawer', status: 'open' },
        ],
      },
      DrawerActions.toggleDrawer(),
      options
    )?.state
  ).toEqual({
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
  });

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
      },
      DrawerActions.toggleDrawer(),
      options
    )?.state
  ).toEqual({
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
    history: [
      { type: 'route', key: 'bar' },
      { type: 'drawer', status: 'open' },
    ],
  });
});

test('updates history on focus change with backBehavior: history', () => {
  const router = DrawerRouter({ backBehavior: 'history' });

  let state: DrawerNavigationState<ParamListBase> = {
    index: 0,
    key: 'drawer-test',
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false as const,
    routeKeySeq: 0,
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
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false as const,
    routeKeySeq: 0,
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
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'bar-0' }],
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
      },
      'bar-0'
    )
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    stale: false,
    routeKeySeq: 0,
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
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'bar-0' }],
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
      },
      'bar-0'
    )
  ).toEqual({
    index: 0,
    key: 'drawer-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz' },
      { key: 'qux-0', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
  });

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
        history: [
          { type: 'route', key: 'bar-0' },
          { type: 'drawer', status: 'open' },
        ],
        stale: false,
        routeKeySeq: 0,
        type: 'drawer',
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
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'baz-0' },
    ],
    stale: false,
    routeKeySeq: 0,
    type: 'drawer',
  });
});
