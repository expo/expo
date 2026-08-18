import { describe, expect, jest, test } from '@jest/globals';
import { expectTypeOf } from 'expect-type';

import { createInitialState } from '../../core/createInitialState';
import {
  CommonActions,
  type ParamListBase,
  type RouterConfigOptions,
  TabActions,
  type TabActionHelpers,
  type TabNavigationState,
  TabRouter,
} from '../index';

jest.mock('nanoid/non-secure', () => ({ nanoid: jest.fn(() => 'test') }));

describe('state without router metadata', () => {
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const createState = (index = 1): TabNavigationState<ParamListBase> => ({
    stale: false,
    key: 'root',
    index,
    routeNames: options.routeNames,
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
    ],
  });

  test('handled actions return tab type and history', () => {
    const result = TabRouter({}).getStateForAction(
      createState(0),
      TabActions.jumpTo('baz'),
      options
    );

    expect(result?.state).toMatchObject({ type: 'tab', history: expect.any(Array) });
  });

  test('complete RESET state gets tab type and rebuilt history', () => {
    const state = createState();
    const result = TabRouter({}).getStateForAction(
      state,
      CommonActions.reset({ ...state, index: 0, routes: [state.routes[0]!] }),
      options
    );

    expect(result?.state).toMatchObject({
      type: 'tab',
      history: [{ type: 'route', key: 'bar' }],
    });
  });

  test('throws for partial RESET state', () => {
    expect(() =>
      TabRouter({}).getStateForAction(
        createState(),
        CommonActions.reset({ routes: [{ name: 'bar' }] }),
        options
      )
    ).toThrow('The RESET action payload must contain a complete navigation state.');
  });

  test('route focus returns tab type and history', () => {
    expect(TabRouter({}).getStateForRouteFocus(createState(0), 'baz')).toMatchObject({
      type: 'tab',
      history: expect.any(Array),
    });
  });

  test('preserves drawer type when used by DrawerRouter', () => {
    const state = { ...createState(0), type: 'drawer' as const };
    // DrawerRouter delegates to TabRouter with the structurally compatible drawer state.
    const result = TabRouter({}).getStateForAction(
      state as unknown as TabNavigationState<ParamListBase>,
      TabActions.jumpTo('baz'),
      options
    );

    expect(result?.state.type).toBe('drawer');
  });
});

const createTabState = (
  options: RouterConfigOptions,
  initialRouteName?: string
): TabNavigationState<ParamListBase> => {
  const state = createInitialState<TabNavigationState<ParamListBase>>({
    ...options,
    initialRouteName,
  });

  return {
    ...state,
    type: 'tab',
    key: 'tab-test',
    history: state.routes.length === 0 ? [] : [{ type: 'route', key: state.routes[0]!.key }],
  };
};

test('types replace action helper params', () => {
  type Params = {
    optional: undefined;
    required: { id: string };
  };

  expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('optional');
  expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('required', { id: '1' });
  // @ts-expect-error: Required route params cannot be omitted.
  expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('required');
  // @ts-expect-error: Route params must match the route's param type.
  expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('required', { id: 1 });
  // @ts-expect-error: The route must exist in the param list.
  expectTypeOf<TabActionHelpers<Params>['replace']>().toBeCallableWith('missing');
});

test('handles empty tab states', () => {
  const router = TabRouter({});
  const emptyOptions: RouterConfigOptions = {
    routeNames: [],
    routeGetIdList: {},
  };
  const state = createTabState({
    routeNames: ['index'],
    routeGetIdList: {},
  });

  const emptyState = router.getStateForAction(
    state,
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: [] } },
    emptyOptions
  )!.state as TabNavigationState<ParamListBase>;
  expect(emptyState).toMatchObject({ index: -1, routes: [], history: [] });
  expect(router.getStateForAction(emptyState, CommonActions.goBack(), emptyOptions)).toBeNull();
});

test.each([
  CommonActions.navigate('baz', { value: 2 }),
  TabActions.jumpTo('baz', { value: 2 }),
  TabActions.replace('baz', { value: 2 }),
])('$type mints and focuses an absent declared route', (action) => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state = createTabState(options);

  const result = router.getStateForAction(state, action, options)!.state;

  expect(result.routes).toEqual([
    { key: 'bar-test', name: 'bar' },
    { key: 'baz-test', name: 'baz', params: { value: 2 } },
  ]);
  expect(result.index).toBe(1);
  expect(result.routes.filter((route) => route.name === 'baz')).toHaveLength(1);
});

test('returns the selected route key when selecting an existing route', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz' },
    ],
    history: [{ type: 'route' as const, key: 'bar-key' }],
  };

  const result = router.getStateForAction(state, CommonActions.navigate('baz'), options);

  expect(result?.affectedRouteKey).toBe('baz-key');
});

test('attaches trusted state when selecting an existing route', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const childState = { routes: [{ name: 'child' }], __internal__routerActionState: true as const };
  const state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz' },
    ],
    history: [{ type: 'route' as const, key: 'bar-key' }],
  };

  const result = router.getStateForAction(
    state,
    {
      type: 'JUMP_TO',
      payload: { name: 'baz', state: childState },
    },
    options
  );

  expect(result?.state.routes[1]?.state).toBe(childState);
});

test('returns the regenerated route key when the route ID changes', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: { baz: ({ params }) => params?.id as string | undefined },
  };
  const state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-one', name: 'baz', params: { id: 'one' } },
    ],
    history: [{ type: 'route' as const, key: 'bar-key' }],
  };

  const result = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { id: 'two' }),
    options
  );

  expect(result?.affectedRouteKey).toBe('baz-test');
});

test('returns the preloaded route key while focus differs', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz' },
    ],
    history: [{ type: 'route' as const, key: 'bar-key' }],
  };

  const result = router.getStateForAction(state, CommonActions.preload('baz'), options);

  expect(result?.state.index).toBe(0);
  expect(result?.affectedRouteKey).toBe('baz-key');
});

test('attaches trusted state when preloading an unfocused route', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const childState = { routes: [{ name: 'child' }], __internal__routerActionState: true as const };
  const state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz' },
    ],
    history: [{ type: 'route' as const, key: 'bar-key' }],
  };

  const result = router.getStateForAction(
    state,
    {
      type: 'PRELOAD',
      payload: { name: 'baz', state: childState },
    },
    options
  );

  expect(result?.state.index).toBe(0);
  expect(result?.state.routes[1]?.state).toBe(childState);
});

test('attaches trusted state when preloading an absent route', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const childState = { routes: [{ name: 'child' }], __internal__routerActionState: true as const };

  const result = router.getStateForAction(
    createTabState(options),
    {
      type: 'PRELOAD',
      payload: { name: 'baz', state: childState },
    },
    options
  );

  expect(result?.state.index).toBe(0);
  expect(result?.state.routes.find((route) => route.name === 'baz')?.state).toBe(childState);
});

test('returns the history destination key on go back', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state = {
    ...createTabState(options),
    index: 1,
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-key', name: 'baz' },
    ],
    history: [
      { type: 'route' as const, key: 'bar-key' },
      { type: 'route' as const, key: 'baz-key' },
    ],
  };

  const result = router.getStateForAction(state, CommonActions.goBack(), options);

  expect(result?.affectedRouteKey).toBe('bar-key');
});

test('PRELOAD mints an absent declared route without changing focus', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state = createTabState(options);

  const result = router.getStateForAction(
    state,
    { type: 'PRELOAD', payload: { name: 'baz', params: { value: 2 } } },
    options
  )!;

  expect(result.state.routes).toEqual([
    { key: 'bar-test', name: 'bar' },
    { key: 'baz-test', name: 'baz', params: { value: 2 } },
  ]);
  expect(result.state.index).toBe(0);
  expect(result.state.history).toEqual(state.history);
});

test('navigation re-keys a preloaded route when the route ID changes', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: { baz: ({ params }) => params?.id as string | undefined },
  };
  const preloadedState = router.getStateForAction(
    createTabState(options),
    { type: 'PRELOAD', payload: { name: 'baz', params: { id: 'one' } } },
    options
  )!.state;
  // PRELOAD returns a full tab state, but the Router interface also permits partial states.
  const state = {
    ...preloadedState,
    routes: preloadedState.routes.map((route) =>
      route.name === 'baz' ? { ...route, key: 'baz-one' } : route
    ),
  } as TabNavigationState<ParamListBase>;

  const result = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { id: 'two' }),
    options
  )!;

  expect(result.state.routes[result.state.index!]!.key).toBe('baz-test');
});

test('PRELOAD rebuilds history when re-keying the focused route', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz'],
    routeGetIdList: { baz: ({ params }) => params?.id as string | undefined },
  };
  const state: TabNavigationState<ParamListBase> = {
    ...createTabState(options),
    routes: [{ key: 'baz-one', name: 'baz', params: { id: 'one' } }],
    history: [{ type: 'route', key: 'baz-one' }],
  };

  const result = router.getStateForAction(
    state,
    CommonActions.preload('baz', { id: 'two' }),
    options
  );

  expect(result?.state.routes).toEqual([{ key: 'baz-test', name: 'baz', params: { id: 'two' } }]);
  expect(result?.state.history).toEqual([{ type: 'route', key: 'baz-test' }]);
});

test.each<['history' | 'fullHistory']>([['history'], ['fullHistory']])(
  '%s back behavior re-keys the focused route in history on PRELOAD',
  (backBehavior) => {
    const router = TabRouter({ backBehavior });
    const options: RouterConfigOptions = {
      routeNames: ['bar', 'baz'],
      routeGetIdList: { baz: ({ params }) => params?.id as string | undefined },
    };
    const state: TabNavigationState<ParamListBase> = {
      ...createTabState(options),
      index: 1,
      routes: [
        { key: 'bar-key', name: 'bar' },
        { key: 'baz-one', name: 'baz', params: { id: 'one' } },
      ],
      history: [
        { type: 'route', key: 'bar-key' },
        { type: 'route', key: 'baz-one' },
      ],
    };

    // PRELOAD returns a full tab state, but the Router interface also permits partial states.
    const preloaded = router.getStateForAction(
      state,
      CommonActions.preload('baz', { id: 'two' }),
      options
    )!.state as TabNavigationState<ParamListBase>;

    // The last history entry must stay the focused route, otherwise `goBack` reads the wrong target.
    expect(preloaded.history).toEqual([
      { type: 'route', key: 'bar-key' },
      {
        type: 'route',
        key: 'baz-test',
        params: backBehavior === 'fullHistory' ? { id: 'two' } : undefined,
      },
    ]);
    expect(router.getStateForAction(preloaded, CommonActions.goBack(), options)!.state.index).toBe(
      0
    );
  }
);

test('fullHistory back behavior keeps earlier params snapshots when PRELOAD re-keys a route', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: { baz: ({ params }) => params?.id as string | undefined },
  };
  const state: TabNavigationState<ParamListBase> = {
    ...createTabState(options),
    index: 1,
    routes: [
      { key: 'bar-key', name: 'bar' },
      { key: 'baz-one', name: 'baz', params: { id: 'one', page: 2 } },
    ],
    // `fullHistory` keeps duplicate entries, each holding the params of that visit.
    history: [
      { type: 'route', key: 'baz-one', params: { id: 'one', page: 1 } },
      { type: 'route', key: 'bar-key' },
      { type: 'route', key: 'baz-one', params: { id: 'one', page: 2 } },
    ],
  };

  const preloaded = router.getStateForAction(
    state,
    CommonActions.preload('baz', { id: 'two' }),
    options
  )!.state;

  expect(preloaded.history).toEqual([
    { type: 'route', key: 'baz-test', params: { id: 'one', page: 1 } },
    { type: 'route', key: 'bar-key' },
    { type: 'route', key: 'baz-test', params: { id: 'two' } },
  ]);
});

test('actions do not mint undeclared routes', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar'],
    routeGetIdList: {},
  };
  const state = createTabState(options);

  expect(router.getStateForAction(state, CommonActions.navigate('baz'), options)).toBeNull();
  expect(
    router.getStateForAction(state, { type: 'PRELOAD', payload: { name: 'baz' } }, options)
  ).toBeNull();
});

test.each<['firstRoute' | 'initialRoute' | 'order', string | undefined, string]>([
  ['firstRoute', undefined, 'bar'],
  ['initialRoute', 'baz', 'baz'],
  ['order', undefined, 'baz'],
])('%s back behavior mints an absent back target', (backBehavior, initialRouteName, name) => {
  const router = TabRouter({ backBehavior, initialRouteName });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  const state: TabNavigationState<ParamListBase> = {
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: options.routeNames,
    routes: [{ key: 'qux-key', name: 'qux' }],
  };

  const result = router.getStateForAction(state, CommonActions.goBack(), options)!.state;

  expect(result.routes.map((route) => route.name)).toEqual(['qux', name]);
  expect(result.routes[result.index!]).toEqual({ key: `${name}-test`, name });
});

test.each<['firstRoute' | 'initialRoute' | 'order', string | undefined, string]>([
  ['firstRoute', undefined, 'bar'],
  ['initialRoute', 'baz', 'baz'],
  ['order', undefined, 'baz'],
])('%s PRELOAD inserts the back target into history', (backBehavior, initialRouteName, name) => {
  const router = TabRouter({ backBehavior, initialRouteName });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  const focusedState: TabNavigationState<ParamListBase> = {
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: options.routeNames,
    routes: [{ key: 'qux-key', name: 'qux' }],
  };
  const state = router.getStateForAction(
    focusedState,
    { type: 'PRELOAD', payload: { name } },
    options
  )!.state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: `${name}-test` },
    { type: 'route', key: 'qux-key' },
  ]);

  const result = router.getStateForAction(state, CommonActions.goBack(), options)!;

  expect(result.state.routes[result.state.index!]!.name).toBe(name);
  expect(result.state.history).toEqual([{ type: 'route', key: `${name}-test` }]);
});

test('gets state on route names change', () => {
  const router = TabRouter({});

  expect(
    router.getStateForAction(
      {
        index: 0,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        history: [{ type: 'route', key: 'bar-test' }],
        stale: false,
        type: 'tab',
      },
      {
        type: 'ROUTE_NAMES_CHANGED',
        payload: { routeNames: ['qux', 'baz', 'foo', 'fiz'] },
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeGetIdList: {},
      }
    )?.state
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [
      { type: 'route', key: 'qux-test' },
      { type: 'route', key: 'baz-test' },
    ],
    stale: false,
    type: 'tab',
  });

  expect(
    router.getStateForAction(
      {
        index: 0,
        key: 'tab-test',
        routeNames: ['bar', 'baz'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
        ],
        history: [{ type: 'route', key: 'bar-test' }],
        stale: false,
        type: 'tab',
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['foo', 'fiz'] } },
      {
        routeNames: ['foo', 'fiz'],
        routeGetIdList: {},
      }
    )?.state
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['foo', 'fiz'],
    routes: [{ key: 'foo-test', name: 'foo' }],
    history: [{ type: 'route', key: 'foo-test' }],
    stale: false,
    type: 'tab',
  });
});

test('preserves focused route on route names change', () => {
  const router = TabRouter({});

  expect(
    router.getStateForAction(
      {
        index: 1,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        history: [{ type: 'route', key: 'baz-test' }],
        stale: false,
        type: 'tab',
      },
      {
        type: 'ROUTE_NAMES_CHANGED',
        payload: { routeNames: ['qux', 'foo', 'fiz', 'baz'] },
      },
      {
        routeNames: ['qux', 'foo', 'fiz', 'baz'],
        routeGetIdList: {},
      }
    )?.state
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'foo', 'fiz', 'baz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [
      { type: 'route', key: 'qux-test' },
      { type: 'route', key: 'baz-test' },
    ],
    stale: false,
    type: 'tab',
  });
});

test('falls back to first route if route is removed on route names change', () => {
  const router = TabRouter({});

  expect(
    router.getStateForAction(
      {
        index: 1,
        key: 'tab-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        history: [{ type: 'route', key: 'baz-test' }],
        stale: false,
        type: 'tab',
      },
      {
        type: 'ROUTE_NAMES_CHANGED',
        payload: { routeNames: ['qux', 'foo', 'fiz'] },
      },
      {
        routeNames: ['qux', 'foo', 'fiz'],
        routeGetIdList: {},
      }
    )?.state
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'foo', 'fiz'],
    routes: [{ key: 'qux-test', name: 'qux', params: { name: 'Jane' } }],
    history: [{ type: 'route', key: 'qux-test' }],
    stale: false,
    type: 'tab',
  });
});

test('falls back to the first surviving route in state order', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['qux', 'bar'],
    routeGetIdList: {},
  };
  const state = {
    ...createTabState({ ...options, routeNames: ['bar', 'baz', 'qux'] }),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    index: 1,
  };

  const result = router.getStateForAction(
    state,
    {
      type: 'ROUTE_NAMES_CHANGED',
      payload: { routeNames: options.routeNames },
    },
    options
  )!.state;

  expect(result.routes[result.index!]!.name).toBe('bar');
});

test('returns the same tab state when route names already match', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };
  const state = createTabState(options);

  expect(
    router.getStateForAction(
      state,
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['bar', 'baz'] } },
      options
    )?.state
  ).toBe(state);
});

test.each<[Parameters<typeof TabRouter>[0]['backBehavior'], string[]]>([
  ['firstRoute', ['qux-test', 'baz-test']],
  ['initialRoute', ['bar-test', 'baz-test']],
  ['order', ['qux-test', 'baz-test']],
  ['history', ['bar-test', 'baz-test']],
  ['fullHistory', ['bar-test', 'baz-test']],
  ['none', ['bar-test', 'baz-test']],
])(
  'keeps route order and focus on an order-only change with backBehavior: %s',
  (backBehavior, expectedHistory) => {
    const router = TabRouter({ backBehavior, initialRouteName: 'bar' });
    const options: RouterConfigOptions = {
      routeNames: ['bar', 'baz', 'qux'],
      routeGetIdList: {},
    };
    const state = {
      ...createTabState(options),
      routes: [
        { key: 'bar-test', name: 'bar' },
        { key: 'baz-test', name: 'baz' },
        { key: 'qux-test', name: 'qux' },
      ],
      index: 1,
      history: [
        { type: 'route' as const, key: 'bar-test' },
        { type: 'route' as const, key: 'baz-test' },
      ],
    };

    expect(
      router.getStateForAction(
        state,
        {
          type: 'ROUTE_NAMES_CHANGED',
          payload: { routeNames: ['qux', 'baz', 'bar'] },
        },
        { ...options, routeNames: ['qux', 'baz', 'bar'] }
      )?.state
    ).toMatchObject({
      index: 1,
      routeNames: ['qux', 'baz', 'bar'],
      routes: state.routes,
      history: expectedHistory.map((key) => ({ type: 'route', key })),
    });
  }
);

test.each<['history' | 'fullHistory', string[]]>([
  ['history', ['qux-test', 'bar-test']],
  ['fullHistory', ['bar-test', 'qux-test', 'bar-test']],
])(
  'keeps visit history aligned when the focused route is removed with backBehavior: %s',
  (backBehavior, expectedHistory) => {
    const router = TabRouter({ backBehavior });
    const options: RouterConfigOptions = {
      routeNames: ['bar', 'baz', 'qux'],
      routeGetIdList: {},
    };
    const state = {
      ...createTabState(options),
      routes: [
        { key: 'bar-test', name: 'bar' },
        { key: 'baz-test', name: 'baz' },
        { key: 'qux-test', name: 'qux' },
      ],
      index: 1,
      history: [
        { type: 'route' as const, key: 'bar-test' },
        { type: 'route' as const, key: 'qux-test' },
        { type: 'route' as const, key: 'baz-test' },
      ],
    };

    expect(
      router.getStateForAction(
        state,
        {
          type: 'ROUTE_NAMES_CHANGED',
          payload: { routeNames: ['bar', 'qux'] },
        },
        { ...options, routeNames: ['bar', 'qux'] }
      )?.state
    ).toMatchObject({
      index: 0,
      history: expectedHistory.map((key) => ({ type: 'route', key })),
    });
  }
);

test('handles navigate action', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
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
    type: 'tab',
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

test('merges params on navigate when specified', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz', params: { color: 'tomato' } },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      CommonActions.navigate('baz', { answer: 42 }, { merge: true }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz', params: { color: 'tomato', answer: 42 } },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'baz' }],
  });
});

test("doesn't navigate to nonexistent screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      CommonActions.navigate('non-existent'),
      options
    )
  ).toBeNull();

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      CommonActions.navigate('foo', { answer: 42 }),
      options
    )
  ).toBeNull();
});

test('ensures unique ID for navigate', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate('baz', { foo: 'a' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      CommonActions.navigate('bar', { foo: 'a' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar-test' },
    ],
  });
});

test('handles jump to action', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      TabActions.jumpTo('bar'),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });
});

test("doesn't jump to nonexistent screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      TabActions.jumpTo('foo', { answer: 42 }),
      options
    )
  ).toBeNull();
});

test('ensures unique ID for jump to', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {
      baz: ({ params }) => params?.foo,
      bar: ({ params }) => params?.foo,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      TabActions.jumpTo('baz', { foo: 'a' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'bar', name: 'bar' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
        ],
        history: [{ type: 'route', key: 'bar' }],
      },
      TabActions.jumpTo('bar', { foo: 'a' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar-test' },
    ],
  });
});

test('replaces the focused route when the destination is the first tab', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  let state = createTabState(options);
  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('bar'), options);

  expect(nextState?.state.history).toEqual([
    { type: 'route', key: 'baz-test' },
    { type: 'route', key: 'bar-test' },
  ]);
});

test('replaces the focused route based on visit history instead of route order', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux', 'foo'],
    routeGetIdList: {},
  };
  let state = createTabState(options);
  state = router.getStateForAction(state, TabActions.jumpTo('foo'), options)!
    .state as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options);

  expect(nextState?.state.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'foo-test' },
    { type: 'route', key: 'qux-test' },
  ]);
});

test('only removes the latest visit when replacing with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  let state = createTabState(options);
  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options);

  expect(nextState?.state.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'baz-test' },
    { type: 'route', key: 'qux-test' },
  ]);
});

test('replaces the focused route with default backBehavior: firstRoute', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  let state = createTabState(options);
  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(2);
  expect(nextState.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'qux-test' },
  ]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)?.state.index).toBe(0);
});

test('replaces the focused route with backBehavior: order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  let state = createTabState(options);
  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(2);
  expect(nextState.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'qux-test' },
  ]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)?.state.index).toBe(0);
});

test('replaces the focused route with backBehavior: initialRoute', () => {
  const router = TabRouter({
    backBehavior: 'initialRoute',
    initialRouteName: 'baz',
  });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  let state = createTabState(options, 'baz');
  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(2);
  expect(nextState.history).toEqual([
    { type: 'route', key: 'baz-test' },
    { type: 'route', key: 'qux-test' },
  ]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)?.state.index).toBe(0);
});

test('replaces the focused route with backBehavior: none', () => {
  const router = TabRouter({ backBehavior: 'none' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  const state = createTabState(options);

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(1);
  expect(nextState.history).toEqual([{ type: 'route', key: 'qux-test' }]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)).toBeNull();
});

test('preserves history when replacing a tab with itself', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  let state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };
  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('baz'), options);

  expect(nextState?.state.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'baz-test' },
  ]);
});

test('preserves the navigator key across repeated replaces', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };
  const initialState = createTabState(options);

  const replacedState = router.getStateForAction(initialState, TabActions.replace('baz'), options)!
    .state as TabNavigationState<ParamListBase>;
  const replacedAgainState = router.getStateForAction(
    replacedState,
    TabActions.replace('qux'),
    options
  );

  expect(replacedState.key).toBe(initialState.key);
  expect(replacedAgainState?.state.key).toBe(initialState.key);
});

test('handles back action with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 0,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 2,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'qux-test' },
    ],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'qux-test' },
      { type: 'route', key: 'baz-test' },
    ],
  });
});

test('handles back action with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 0,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 2,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'qux-test' },
    ],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'qux-test' },
      { type: 'route', key: 'baz-test' },
    ],
  });
});

test('handles back action with backBehavior: order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'bar-test' },
      { type: 'route', key: 'baz-test' },
    ],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 0,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('handles back action with backBehavior: initialRoute', () => {
  const router = TabRouter({ backBehavior: 'initialRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = {
    ...createTabState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 0,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 0,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'bar-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('handles back action with backBehavior: initialRoute and initialRouteName', () => {
  const router = TabRouter({
    backBehavior: 'initialRoute',
    initialRouteName: 'baz',
  });

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = {
    ...createTabState(options, 'baz'),
    index: 1,
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)?.state).toEqual({
    stale: false,
    type: 'tab',
    key: 'tab-test',
    index: 1,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('handles back action with backBehavior: none', () => {
  const router = TabRouter({ backBehavior: 'none' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = createTabState(options);

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('updates route key history on navigate and jump to with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state: TabNavigationState<ParamListBase> = {
    index: 1,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    history: [{ type: 'route', key: 'baz-0' }],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false as const,
    type: 'tab',
  };

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);

  state = router.getStateForAction(state, CommonActions.navigate('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(state, CommonActions.goBack(), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(state, CommonActions.goBack(), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([{ type: 'route', key: 'qux-0' }]);
});

test('updates route key history on focus change with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  let state: TabNavigationState<ParamListBase> = {
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route' as const, key: 'bar-0' }],
    stale: false,
    type: 'tab',
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

test('updates route key history on navigate and jump to with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state: TabNavigationState<ParamListBase> = {
    index: 1,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    history: [{ type: 'route', key: 'baz-0' }],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false as const,
    type: 'tab',
  };

  state = router.getStateForAction(state, TabActions.jumpTo('qux'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);

  state = router.getStateForAction(state, CommonActions.navigate('bar'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(state, TabActions.jumpTo('baz'), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(state, CommonActions.goBack(), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(state, CommonActions.goBack(), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);
});

test('preserves params in history with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  let state = createTabState({
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  });

  state = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { value: 'first' }),
    options
  )!.state as TabNavigationState<ParamListBase>;

  expect(state.routes[1]!.params).toEqual({ value: 'first' });
  expect(state.history?.[1]!.params).toEqual({ value: 'first' });

  state = router.getStateForAction(
    state,
    CommonActions.navigate('qux', { value: 'second' }),
    options
  )!.state as TabNavigationState<ParamListBase>;

  expect(state.routes[2]!.params).toEqual({ value: 'second' });
  expect(state.history?.[2]!.params).toEqual({ value: 'second' });

  state = router.getStateForAction(
    state,
    CommonActions.setParams({ value: 'updated with setParams' }),
    options
  )!.state as TabNavigationState<ParamListBase>;

  expect(state.routes[2]!.params).toEqual({ value: 'updated with setParams' });
  expect(state.history?.[2]!.params).toEqual({
    value: 'updated with setParams',
  });

  state = router.getStateForAction(
    state,
    CommonActions.replaceParams({ value: 'replaced params' }),
    options
  )!.state as TabNavigationState<ParamListBase>;

  expect(state.routes[2]!.params).toEqual({ value: 'replaced params' });
  expect(state.history?.[2]!.params).toEqual({ value: 'replaced params' });

  state = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { value: 'updated' }),
    options
  )!.state as TabNavigationState<ParamListBase>;

  expect(state.routes[1]!.params).toEqual({ value: 'updated' });
  expect(state.history?.[3]!.params).toEqual({ value: 'updated' });

  state = router.getStateForAction(state, CommonActions.goBack(), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.index).toBe(2);
  expect(state.routes[2]!.params).toEqual({ value: 'replaced params' });

  state = router.getStateForAction(state, CommonActions.goBack(), options)!
    .state as TabNavigationState<ParamListBase>;

  expect(state.index).toBe(1);
  expect(state.routes[1]!.params).toEqual({ value: 'first' });
});

test('updates route key history on focus change with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });

  let state: TabNavigationState<ParamListBase> = {
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-0', name: 'baz', params: { answer: 42 } },
      { key: 'qux-0', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route' as const, key: 'bar-0' }],
    stale: false,
    type: 'tab',
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

  expect(router.getStateForRouteFocus(state, 'baz-0').history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
    { type: 'route', key: 'qux-0', params: { name: 'Jane' } },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
  ]);

  state = router.getStateForRouteFocus(state, 'baz-0');

  expect(router.getStateForRouteFocus(state, 'baz-0').history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
    { type: 'route', key: 'qux-0', params: { name: 'Jane' } },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
  ]);

  state = router.getStateForRouteFocus(state, 'baz-0');

  expect(router.getStateForRouteFocus(state, 'baz-0').history).toEqual([
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
    { type: 'route', key: 'qux-0', params: { name: 'Jane' } },
    { type: 'route', key: 'baz-0', params: { answer: 42 } },
  ]);
});

test('adds path on navigate if provided', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate({
        name: 'bar',
        path: '/foo/bar',
      }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', path: '/foo/bar' },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          {
            key: 'bar',
            name: 'bar',
            path: '/foo/bar',
          },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate({
        name: 'bar',
        params: { fruit: 'orange' },
        path: '/foo/baz',
      }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar',
        name: 'bar',
        params: { fruit: 'orange' },
        path: '/foo/baz',
      },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });
});

test("doesn't remove existing path on navigate if not provided", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', path: '/foo/bar' },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate({ name: 'bar' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', path: '/foo/bar' },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });
});

test("doesn't merge params on navigate to an existing screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate('bar'),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate('bar', { fruit: 'orange' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar' },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate('qux', { test: 12 }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux', params: { test: 12 } },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'qux' },
    ],
  });
});

test('merges params on navigate to an existing screen if merge: true', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate({
        name: 'bar',
        merge: true,
      }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.navigate({
        name: 'bar',
        params: { fruit: 'orange' },
        merge: true,
      }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42, fruit: 'orange' } },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });
});

test("doesn't merge params on jump to an existing screen", () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      TabActions.jumpTo('bar'),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      TabActions.jumpTo('bar', { fruit: 'orange' }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 1,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
      { key: 'qux', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz' },
      { type: 'route', key: 'bar' },
    ],
  });
});

test('handles screen preloading', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {
      bar: ({ params }) => `bar-${params?.answer}`,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
          { key: 'qux', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz' }],
      },
      CommonActions.preload('qux'),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'qux', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          { key: 'bar-test', name: 'bar', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz-test' }],
      },
      CommonActions.preload('bar', { answer: 43 }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'bar-test', name: 'bar', params: { answer: 43 } },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          {
            key: 'bar-test-old',
            name: 'bar',
            params: { answer: 42, willBe: 'removed' },
          },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz-test' }],
      },
      CommonActions.preload('bar', { answer: 43 }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      { key: 'bar-test', name: 'bar', params: { answer: 43 } },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          {
            key: 'bar-test',
            name: 'bar',
            params: { answer: 42, willBe: 'overrode' },
          },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz-test' }],
      },
      CommonActions.preload('bar', { answer: 42 }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42 },
      },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          {
            key: 'bar-test',
            name: 'bar',
            params: { answer: 42, willBe: 'merged' },
          },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [{ type: 'route', key: 'baz-test' }],
      },
      CommonActions.navigate('qux'),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42, willBe: 'merged' },
      },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz-test' },
      { type: 'route', key: 'qux-test' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          {
            key: 'bar-test',
            name: 'bar',
            params: { answer: 42, willBe: 'merged' },
          },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [
          { type: 'route', key: 'baz-test' },
          { type: 'route', key: 'qux-test' },
        ],
      },
      CommonActions.goBack(),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 0,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42, willBe: 'merged' },
      },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [{ type: 'route', key: 'baz-test' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          {
            key: 'bar-some',
            name: 'bar',
            params: { answer: 42 },
          },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [
          { type: 'route', key: 'bar-some' },
          { type: 'route', key: 'qux-test' },
        ],
      },
      CommonActions.preload('bar', { answer: 42 }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      {
        key: 'bar-some',
        name: 'bar',
        params: { answer: 42 },
      },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz-test' },
      { type: 'route', key: 'qux-test' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        key: 'root',
        index: 2,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz-test', name: 'baz' },
          {
            key: 'bar-some',
            name: 'bar',
            params: { answer: 42 },
          },
          { key: 'qux-test', name: 'qux' },
        ],
        history: [
          { type: 'route', key: 'bar-some' },
          { type: 'route', key: 'qux-test' },
        ],
      },
      CommonActions.preload('bar', { answer: 43 }),
      options
    )?.state
  ).toEqual({
    stale: false,
    type: 'tab',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz-test', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 43 },
      },
      { key: 'qux-test', name: 'qux' },
    ],
    history: [
      { type: 'route', key: 'baz-test' },
      { type: 'route', key: 'qux-test' },
    ],
  });
});

describe('state without history', () => {
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  const createState = (index = 1): TabNavigationState<ParamListBase> => ({
    stale: false,
    type: 'tab',
    key: 'root',
    index,
    routeNames: options.routeNames,
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz', name: 'baz' },
      { key: 'qux', name: 'qux' },
    ],
  });

  test.each<['firstRoute' | 'history' | 'fullHistory', string[]]>([
    ['firstRoute', ['bar', 'qux']],
    ['history', ['baz', 'qux']],
    ['fullHistory', ['baz', 'qux']],
  ])('handles navigation with backBehavior: %s', (backBehavior, expectedKeys) => {
    const router = TabRouter({ backBehavior });

    for (const action of [CommonActions.navigate('qux'), TabActions.jumpTo('qux')]) {
      const result = router.getStateForAction(createState(), action, options);

      expect(result?.state.history?.map((item) => item.key)).toEqual(expectedKeys);
    }
  });

  test.each<['firstRoute' | 'initialRoute' | 'order', string | undefined, string]>([
    ['firstRoute', undefined, 'bar'],
    ['initialRoute', 'baz', 'baz'],
    ['order', undefined, 'baz'],
  ])(
    'reconstructs the back target with backBehavior: %s',
    (backBehavior, initialRouteName, expectedName) => {
      const router = TabRouter({ backBehavior, initialRouteName });
      const result = router.getStateForAction(createState(2), CommonActions.goBack(), options);

      expect(result && result.state.routes[result.state.index ?? -1]?.name).toBe(expectedName);
      expect(result?.state.history).toBeDefined();
    }
  );

  test.each(['history', 'fullHistory'] as const)(
    'does not go back with an absent visit history and backBehavior: %s',
    (backBehavior) => {
      const router = TabRouter({ backBehavior });

      expect(router.getStateForAction(createState(2), CommonActions.goBack(), options)).toBeNull();
    }
  );

  test.each([
    CommonActions.setParams({ answer: 42 }),
    CommonActions.preload('bar'),
    TabActions.replace('qux'),
  ])('handles $type', (action) => {
    const router = TabRouter({ backBehavior: 'history' });
    const result = router.getStateForAction(createState(), action, options);

    expect(result?.state.history).toBeDefined();
  });

  test('handles ROUTE_NAMES_CHANGED', () => {
    const router = TabRouter({ backBehavior: 'history' });
    const routeNames = ['qux', 'baz', 'bar'];
    const result = router.getStateForAction(
      createState(),
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames } },
      { ...options, routeNames }
    );

    expect(result?.state.history).toBeDefined();
  });

  test.each<[Parameters<typeof TabRouter>[0]['backBehavior'], string | undefined, string[]]>([
    ['order', undefined, ['foo-0', 'bar-0', 'baz-0']],
    ['history', undefined, ['baz-0']],
    ['fullHistory', undefined, ['baz-0']],
    ['firstRoute', 'bar', ['foo-0', 'baz-0']],
    ['initialRoute', 'bar', ['bar-0', 'baz-0']],
    ['none', undefined, ['baz-0']],
  ])(
    'reconstructs history during route focus with backBehavior: %s',
    (backBehavior, initialRouteName, keys) => {
      const router = TabRouter({ backBehavior, initialRouteName });
      const state: TabNavigationState<ParamListBase> = {
        stale: false,
        type: 'tab',
        key: 'tab-test',
        index: 2,
        routeNames: ['foo', 'bar', 'baz', 'qux'],
        routes: [
          { key: 'foo-0', name: 'foo' },
          { key: 'bar-0', name: 'bar' },
          { key: 'baz-0', name: 'baz' },
          { key: 'qux-0', name: 'qux' },
        ],
      };

      expect(router.getStateForRouteFocus(state, 'baz-0').history).toEqual(
        keys.map((key) => ({ type: 'route', key }))
      );
    }
  );

  test('preserves params when reconstructing full history', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    const state = createState(0);
    const stateWithParams = {
      ...state,
      routes: state.routes.map((route, index) =>
        index === 0 ? { ...route, params: { answer: 42 } } : route
      ),
    };
    // The action starts from a complete state and returns a complete state.
    const navigatedState = router.getStateForAction(
      stateWithParams,
      TabActions.jumpTo('baz'),
      options
    )!.state as TabNavigationState<ParamListBase>;
    const result = router.getStateForAction(navigatedState, CommonActions.goBack(), options);

    expect(result?.state.routes[0]!.params).toEqual({ answer: 42 });
  });

  test('keeps the focused route in history when it is not declared', () => {
    const router = TabRouter({});
    const state = {
      ...createState(1),
      routeNames: ['bar'],
      routes: [
        { key: 'bar', name: 'bar' },
        { key: 'zap', name: 'zap' },
      ],
    };

    expect(router.getStateForRouteFocus(state, 'missing').history).toEqual([
      { type: 'route', key: 'zap' },
    ]);
  });

  test('keeps the params of an undeclared focused route with backBehavior: fullHistory', () => {
    const router = TabRouter({ backBehavior: 'fullHistory' });
    const state = {
      ...createState(1),
      routeNames: ['bar'],
      routes: [
        { key: 'bar', name: 'bar' },
        { key: 'zap', name: 'zap', params: { answer: 42 } },
      ],
    };

    // Going back must restore the params, not overwrite them with `undefined`.
    const navigatedState = router.getStateForAction(state, TabActions.jumpTo('bar'), options)!
      .state as TabNavigationState<ParamListBase>;
    const result = router.getStateForAction(navigatedState, CommonActions.goBack(), options);

    expect(result?.state.routes[1]!.params).toEqual({ answer: 42 });
  });

  test('handles an empty state', () => {
    const router = TabRouter({});
    const state = {
      ...createState(-1),
      routeNames: [],
      routes: [],
    };

    expect(router.getStateForRouteFocus(state, 'missing').history).toEqual([]);
  });
});
