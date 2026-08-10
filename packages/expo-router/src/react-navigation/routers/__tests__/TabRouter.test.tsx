import { expect, jest, test } from '@jest/globals';
import { expectTypeOf } from 'expect-type';

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

test('gets initial state from route names and params with initialRouteName', () => {
  const router = TabRouter({ initialRouteName: 'baz' });

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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'baz-test', name: 'baz', params: { answer: 42 } }],
    history: [{ type: 'route', key: 'baz-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('gets initial state from route names and params without initialRouteName', () => {
  const router = TabRouter({});

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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    history: [{ type: 'route', key: 'bar-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('gets an empty initial state without route names', () => {
  const router = TabRouter({});

  expect(
    router.getInitialState({ routeNames: [], routeParamList: {}, routeGetIdList: {} })
  ).toEqual({
    index: -1,
    key: 'tab-test',
    routeNames: [],
    routes: [],
    history: [],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('handles empty tab states', () => {
  const router = TabRouter({});
  const emptyOptions: RouterConfigOptions = {
    routeNames: [],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = router.getInitialState({
    routeNames: ['index'],
    routeParamList: {},
    routeGetIdList: {},
  });

  expect(router.getRehydratedState({ routes: [] }, emptyOptions)).toMatchObject({
    index: -1,
    routes: [],
    history: [],
  });
  const emptyState = router.getStateForAction(
    state,
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: [] } },
    emptyOptions
  ) as TabNavigationState<ParamListBase>;
  expect(emptyState).toMatchObject({ index: -1, routes: [], history: [] });
  expect(router.getStateForAction(emptyState, CommonActions.goBack(), emptyOptions)).toBeNull();
});

test('gets rehydrated state from partial state', () => {
  const router = TabRouter({});

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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar', params: undefined },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [{ type: 'route', key: 'bar-0' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });

  expect(
    router.getRehydratedState(
      {
        routes: [{ key: 'baz-0', name: 'baz' }],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'baz-0', name: 'baz', params: { answer: 42 } }],
    history: [{ type: 'route', key: 'baz-0' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'qux-2' },
    ],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });

  expect(
    router.getRehydratedState(
      {
        index: 1,
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-2', name: 'qux' },
        ],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    history: [
      { type: 'route', key: 'bar-0' },
      { type: 'route', key: 'qux-2' },
    ],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    history: [{ type: 'route', key: 'bar-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });

  expect(
    router.getRehydratedState(
      {
        index: 1,
        history: [
          { type: 'route', key: 'bar-test' },
          { type: 'route', key: 'qux-test' },
          { type: 'route', key: 'foo-test' },
        ],
        routes: [],
      },
      options
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    history: [{ type: 'route', key: 'bar-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test.each([
  CommonActions.navigate('baz', { value: 2 }),
  TabActions.jumpTo('baz', { value: 2 }),
  TabActions.replace('baz', { value: 2 }),
])('$type mints and focuses an absent declared route', (action) => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: { baz: { initial: true } },
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

  const result = router.getStateForAction(state, action, options)!;

  expect(result.routes).toEqual([
    { key: 'bar-test', name: 'bar' },
    { key: 'baz-test', name: 'baz', params: { initial: true, value: 2 } },
  ]);
  expect(result.index).toBe(1);
  expect(result.routes.filter((route) => route.name === 'baz')).toHaveLength(1);
});

test('PRELOAD mints an absent declared route without changing focus', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: { baz: { initial: true } },
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

  const result = router.getStateForAction(
    state,
    { type: 'PRELOAD', payload: { name: 'baz', params: { value: 2 } } },
    options
  )!;

  expect(result.routes).toEqual([
    { key: 'bar-test', name: 'bar' },
    { key: 'baz-test', name: 'baz', params: { initial: true, value: 2 } },
  ]);
  expect(result.index).toBe(0);
  expect(result.history).toEqual(state.history);
  expect(result.preloadedRouteKeys).toEqual(['baz-test']);
});

test('navigation removes a stale preload key when the route ID changes', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: {},
    routeGetIdList: { baz: ({ params }) => params?.id as string | undefined },
  };
  const preloadedState = router.getStateForAction(
    router.getInitialState(options),
    { type: 'PRELOAD', payload: { name: 'baz', params: { id: 'one' } } },
    options
  )!;
  const state = {
    ...preloadedState,
    routes: preloadedState.routes.map((route) =>
      route.name === 'baz' ? { ...route, key: 'baz-one' } : route
    ),
    preloadedRouteKeys: ['baz-one'],
  } as TabNavigationState<ParamListBase>;

  const result = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { id: 'two' }),
    options
  )!;

  expect(result.routes[result.index!]!.key).toBe('baz-test');
  expect(result.preloadedRouteKeys).toEqual([]);
});

test('actions do not mint undeclared routes', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

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
    routeParamList: { baz: { initial: true } },
    routeGetIdList: {},
  };
  const state = router.getRehydratedState({ routes: [{ key: 'qux-key', name: 'qux' }] }, options);

  const result = router.getStateForAction(state, CommonActions.goBack(), options)!;

  expect(result.routes.map((route) => route.name)).toEqual(['qux', name]);
  expect(result.routes[result.index!]!.name).toBe(name);
});

test.each<['firstRoute' | 'initialRoute' | 'order', string | undefined, string]>([
  ['firstRoute', undefined, 'bar'],
  ['initialRoute', 'baz', 'baz'],
  ['order', undefined, 'baz'],
])('%s back behavior focuses a preloaded back target', (backBehavior, initialRouteName, name) => {
  const router = TabRouter({ backBehavior, initialRouteName });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const focusedState = router.getRehydratedState(
    { routes: [{ key: 'qux-key', name: 'qux' }] },
    options
  ) as TabNavigationState<ParamListBase>;
  const state = router.getStateForAction(
    focusedState,
    { type: 'PRELOAD', payload: { name } },
    options
  ) as TabNavigationState<ParamListBase>;

  const result = router.getStateForAction(state, CommonActions.goBack(), options)!;

  expect(result.routes[result.index!]!.name).toBe(name);
  expect(result.preloadedRouteKeys).toEqual([]);
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
    history: [{ type: 'route', key: 'bar-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('restores correct history on rehydrating with backBehavior: order', () => {
  const router = TabRouter({ backBehavior: 'order' });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
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
    history: [
      { key: 'foo-0', type: 'route' },
      { key: 'bar-0', type: 'route' },
      { key: 'baz-0', type: 'route' },
    ],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('restores correct history on rehydrating with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
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
    history: [{ key: 'baz-0', type: 'route' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('restores correct history on rehydrating with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
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
    history: [{ key: 'baz-0', type: 'route' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('restores correct history on rehydrating with backBehavior: firstRoute', () => {
  const router = TabRouter({
    backBehavior: 'firstRoute',
    initialRouteName: 'bar',
  });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
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
    history: [
      { key: 'foo-0', type: 'route' },
      { key: 'baz-0', type: 'route' },
    ],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('restores correct history on rehydrating with backBehavior: initialRoute', () => {
  const router = TabRouter({
    backBehavior: 'initialRoute',
    initialRouteName: 'bar',
  });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
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
    history: [
      { key: 'bar-0', type: 'route' },
      { key: 'baz-0', type: 'route' },
    ],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('restores correct history on rehydrating with backBehavior: none', () => {
  const router = TabRouter({ backBehavior: 'none' });

  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
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
    history: [{ key: 'baz-0', type: 'route' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
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
        preloadedRouteKeys: [],
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['qux', 'baz', 'foo', 'fiz'] } },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        routeGetIdList: {},
      }
    )
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
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['foo', 'fiz'] } },
      {
        routeNames: ['foo', 'fiz'],
        routeParamList: {},
        routeGetIdList: {},
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['foo', 'fiz'],
    routes: [{ key: 'foo-test', name: 'foo', params: undefined }],
    history: [{ type: 'route', key: 'foo-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['qux', 'foo', 'fiz', 'baz'] } },
      {
        routeNames: ['qux', 'foo', 'fiz', 'baz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        routeGetIdList: {},
      }
    )
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
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['qux', 'foo', 'fiz'] } },
      {
        routeNames: ['qux', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        routeGetIdList: {},
      }
    )
  ).toEqual({
    index: 0,
    key: 'tab-test',
    routeNames: ['qux', 'foo', 'fiz'],
    routes: [{ key: 'qux-test', name: 'qux', params: { name: 'Jane' } }],
    history: [{ type: 'route', key: 'qux-test' }],
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
  });
});

test('falls back to the first surviving route in state order', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['qux', 'bar'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = {
    ...router.getInitialState({ ...options, routeNames: ['bar', 'baz', 'qux'] }),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
    index: 1,
  };

  const result = router.getStateForAction(
    state,
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: options.routeNames } },
    options
  )!;

  expect(result.routes[result.index!]!.name).toBe('bar');
});

test('rehydration falls back to the first surviving route in state order', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['qux', 'bar'],
    routeParamList: {},
    routeGetIdList: {},
  };

  const result = router.getRehydratedState(
    {
      routes: [
        { key: 'bar-test', name: 'bar' },
        { key: 'removed-test', name: 'removed' },
        { key: 'qux-test', name: 'qux' },
      ],
      index: 1,
    },
    options
  );

  expect(result.routes[result.index!]!.name).toBe('bar');
});

test('returns the same tab state when route names already match', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

  expect(
    router.getStateForAction(
      state,
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['bar', 'baz'] } },
      options
    )
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
      routeParamList: {},
      routeGetIdList: {},
    };
    const state = {
      ...router.getInitialState(options),
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
        { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['qux', 'baz', 'bar'] } },
        { ...options, routeNames: ['qux', 'baz', 'bar'] }
      )
    ).toMatchObject({
      index: 1,
      routeNames: ['qux', 'baz', 'bar'],
      routes: state.routes,
      history: expectedHistory.map((key) => ({ type: 'route', key })),
    });
  }
);

test('prunes preloaded keys when route names change', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = {
    ...router.getInitialState(options),
    preloadedRouteKeys: ['bar-test', 'baz-test'],
  };

  expect(
    router.getStateForAction(
      state,
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['baz'] } },
      { ...options, routeNames: ['baz'] }
    )
  ).toMatchObject({ preloadedRouteKeys: ['baz-test'] });
});

test.each<['history' | 'fullHistory', string[]]>([
  ['history', ['qux-test', 'bar-test']],
  ['fullHistory', ['bar-test', 'qux-test', 'bar-test']],
])(
  'keeps visit history aligned when the focused route is removed with backBehavior: %s',
  (backBehavior, expectedHistory) => {
    const router = TabRouter({ backBehavior });
    const options: RouterConfigOptions = {
      routeNames: ['bar', 'baz', 'qux'],
      routeParamList: {},
      routeGetIdList: {},
    };
    const state = {
      ...router.getInitialState(options),
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
        { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['bar', 'qux'] } },
        { ...options, routeNames: ['bar', 'qux'] }
      )
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    routeParamList: {},
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    routeParamList: {},
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('bar'), options);

  expect(nextState?.history).toEqual([
    { type: 'route', key: 'baz-test' },
    { type: 'route', key: 'bar-test' },
  ]);
});

test('replaces the focused route based on visit history instead of route order', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux', 'foo'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('foo'),
    options
  ) as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options);

  expect(nextState?.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'foo-test' },
    { type: 'route', key: 'qux-test' },
  ]);
});

test('only removes the latest visit when replacing with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('qux'), options);

  expect(nextState?.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'baz-test' },
    { type: 'route', key: 'qux-test' },
  ]);
});

test('replaces the focused route with default backBehavior: firstRoute', () => {
  const router = TabRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(
    state,
    TabActions.replace('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(2);
  expect(nextState.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'qux-test' },
  ]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)?.index).toBe(0);
});

test('replaces the focused route with backBehavior: order', () => {
  const router = TabRouter({ backBehavior: 'order' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(
    state,
    TabActions.replace('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(2);
  expect(nextState.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'qux-test' },
  ]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)?.index).toBe(0);
});

test('replaces the focused route with backBehavior: initialRoute', () => {
  const router = TabRouter({
    backBehavior: 'initialRoute',
    initialRouteName: 'baz',
  });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = router.getInitialState(options);
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(
    state,
    TabActions.replace('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(2);
  expect(nextState.history).toEqual([
    { type: 'route', key: 'baz-test' },
    { type: 'route', key: 'qux-test' },
  ]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)?.index).toBe(0);
});

test('replaces the focused route with backBehavior: none', () => {
  const router = TabRouter({ backBehavior: 'none' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const state = router.getInitialState(options);

  const nextState = router.getStateForAction(
    state,
    TabActions.replace('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(nextState.index).toBe(1);
  expect(nextState.history).toEqual([{ type: 'route', key: 'qux-test' }]);
  expect(router.getStateForAction(nextState, CommonActions.goBack(), options)).toBeNull();
});

test('preserves history when replacing a tab with itself', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  let state = {
    ...router.getInitialState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };
  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  const nextState = router.getStateForAction(state, TabActions.replace('baz'), options);

  expect(nextState?.history).toEqual([
    { type: 'route', key: 'bar-test' },
    { type: 'route', key: 'baz-test' },
  ]);
});

test('preserves the navigator key across repeated replaces', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };
  const initialState = router.getInitialState(options);

  const replacedState = router.getStateForAction(
    initialState,
    TabActions.replace('baz'),
    options
  ) as TabNavigationState<ParamListBase>;
  const replacedAgainState = router.getStateForAction(
    replacedState,
    TabActions.replace('qux'),
    options
  );

  expect(replacedState.key).toBe(initialState.key);
  expect(replacedAgainState?.key).toBe(initialState.key);
});

test('handles back action with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = {
    ...router.getInitialState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = {
    ...router.getInitialState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = {
    ...router.getInitialState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('handles back action with backBehavior: initialRoute', () => {
  const router = TabRouter({ backBehavior: 'initialRoute' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = {
    ...router.getInitialState(options),
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('handles back action with backBehavior: initialRoute and initialRouteName', () => {
  const router = TabRouter({
    backBehavior: 'initialRoute',
    initialRouteName: 'baz',
  });

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = {
    ...router.getInitialState(options),
    index: 1,
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('handles back action with backBehavior: none', () => {
  const router = TabRouter({ backBehavior: 'none' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = router.getInitialState(options);

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(router.getStateForAction(state, CommonActions.goBack(), options)).toBeNull();
});

test('updates route key history on navigate and jump to with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
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
    preloadedRouteKeys: [],
  };

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);

  state = router.getStateForAction(
    state,
    CommonActions.navigate('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([{ type: 'route', key: 'qux-0' }]);
});

test('updates route key history on focus change with backBehavior: history', () => {
  const router = TabRouter({ backBehavior: 'history' });

  let state: TabNavigationState<ParamListBase> = {
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
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
    routeParamList: {},
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
    preloadedRouteKeys: [],
  };

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('qux'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);

  state = router.getStateForAction(
    state,
    CommonActions.navigate('bar'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(
    state,
    TabActions.jumpTo('baz'),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
    { type: 'route', key: 'baz-0' },
  ]);

  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
    { type: 'route', key: 'bar-0' },
  ]);

  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.history).toEqual([
    { type: 'route', key: 'baz-0' },
    { type: 'route', key: 'qux-0' },
  ]);
});

test('preserves params in history with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  let state = router.getInitialState({
    routeNames: ['bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  });

  state = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { value: 'first' }),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.routes[1]!.params).toEqual({ value: 'first' });
  expect(state.history[1]!.params).toEqual({ value: 'first' });

  state = router.getStateForAction(
    state,
    CommonActions.navigate('qux', { value: 'second' }),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.routes[2]!.params).toEqual({ value: 'second' });
  expect(state.history[2]!.params).toEqual({ value: 'second' });

  state = router.getStateForAction(
    state,
    CommonActions.setParams({ value: 'updated with setParams' }),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.routes[2]!.params).toEqual({ value: 'updated with setParams' });
  expect(state.history[2]!.params).toEqual({ value: 'updated with setParams' });

  state = router.getStateForAction(
    state,
    CommonActions.replaceParams({ value: 'replaced params' }),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.routes[2]!.params).toEqual({ value: 'replaced params' });
  expect(state.history[2]!.params).toEqual({ value: 'replaced params' });

  state = router.getStateForAction(
    state,
    CommonActions.navigate('baz', { value: 'updated' }),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.routes[1]!.params).toEqual({ value: 'updated' });
  expect(state.history[3]!.params).toEqual({ value: 'updated' });

  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.index).toBe(2);
  expect(state.routes[2]!.params).toEqual({ value: 'replaced params' });

  state = router.getStateForAction(
    state,
    CommonActions.goBack(),
    options
  ) as TabNavigationState<ParamListBase>;

  expect(state.index).toBe(1);
  expect(state.routes[1]!.params).toEqual({ value: 'first' });
});

test('updates route key history on focus change with backBehavior: fullHistory', () => {
  const router = TabRouter({ backBehavior: 'fullHistory' });

  let state: TabNavigationState<ParamListBase> = {
    index: 0,
    key: 'tab-test',
    routeNames: ['bar', 'baz', 'qux'],
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {
      qux: { color: 'indigo' },
    },
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'qux', name: 'qux', params: { color: 'indigo', test: 12 } },
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
    routeParamList: {},
    routeGetIdList: {
      bar: ({ params }) => `bar-${params?.answer}`,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: ['qux'],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: ['bar-test'],
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
        preloadedRouteKeys: ['bar-test-old'],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: ['bar-test'],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: ['bar-test'],
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
        preloadedRouteKeys: ['qux-test'],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: ['baz-test'],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: [],
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
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: ['bar-some'],
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
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'tab',
        preloadedRouteKeys: [],
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
    )
  ).toEqual({
    stale: false,
    type: 'tab',
    preloadedRouteKeys: ['bar-test'],
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
    history: [{ type: 'route', key: 'qux-test' }],
  });
});
