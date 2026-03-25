import { expect, jest, test } from '@jest/globals';

import {
  CommonActions,
  type RouterConfigOptions,
  StackActions,
  StackRouter,
} from '..';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

test('gets initial state from route names and params with initialRouteName', () => {
  const router = StackRouter({ initialRouteName: 'baz' });

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
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'baz-test', name: 'baz', params: { answer: 42 } }],
    stale: false,
    type: 'stack',
  });
});

test('gets initial state from route names and params without initialRouteName', () => {
  const router = StackRouter({});

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
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false,
    type: 'stack',
  });
});

test('gets rehydrated state from partial state', () => {
  const router = StackRouter({});

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
        preloadedRoutes: [{ name: 'baz', key: 'baz-test' }],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    preloadedRoutes: [{ name: 'baz', key: 'baz-test', params: { answer: 42 } }],
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
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
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz', params: { answer: 42 } },
      { key: 'qux-2', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
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
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false,
    type: 'stack',
  });
});

test("doesn't rehydrate state if it's not stale", () => {
  const router = StackRouter({});

  const state = {
    index: 0,
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false as const,
    type: 'stack' as const,
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeParamList: {},
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('gets state on route names change', () => {
  const router = StackRouter({});

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 2,
        key: 'stack-test',
        preloadedRoutes: [],
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
        type: 'stack',
      },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeParamList: {
          qux: { name: 'John' },
          fiz: { fruit: 'apple' },
        },
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
  });

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'stack-test',
        preloadedRoutes: [],
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
        type: 'stack',
      },
      {
        routeNames: ['baz', 'qux'],
        routeParamList: {
          baz: { name: 'John' },
        },
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'baz-test', name: 'baz', params: { name: 'John' } }],
    stale: false,
    type: 'stack',
  });
});

test('gets state on route names change with initialRouteName', () => {
  const router = StackRouter({ initialRouteName: 'qux' });

  expect(
    router.getStateForRouteNamesChange(
      {
        index: 1,
        key: 'stack-test',
        preloadedRoutes: [],
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
        type: 'stack',
      },
      {
        routeNames: ['baz', 'qux'],
        routeParamList: {
          baz: { name: 'John' },
        },
        routeGetIdList: {},
        routeKeyChanges: [],
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    preloadedRoutes: [],
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'qux-test', name: 'qux' }],
    stale: false,
    type: 'stack',
  });
});

test('handles navigate action', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      {
        key: 'qux-test',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
    ],
  });
});

test('updates params on navigate if already on the screen', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      CommonActions.navigate('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
      { key: 'bar-test', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('ensure unique ID is only per route name for navigate', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { test: 'a' } },
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('goes back to matching screen for navigate if pop: true', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      {
        key: 'qux-test',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-a', name: 'bar', params: { foo: 'a' } },
      { key: 'bar-b', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('handles navigate action (legacy)', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar' },
      {
        key: 'qux-test',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      CommonActions.navigateDeprecated('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
      { key: 'bar-test', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('ensure unique ID is only per route name for navigate (legacy)', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { test: 'a' } },
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('handles go back action', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 4,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });
});

test('replaces focused screen with replace', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
        routeNames: ['foo', 'bar', 'baz', 'qux'],
      },
      StackActions.replace('qux', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    preloadedRoutes: [],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test('replaces active screen with replace', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    preloadedRoutes: [],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test("handles replace if source key isn't present but target is not specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    preloadedRoutes: [],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
      { key: 'baz', name: 'baz' },
    ],
    stale: false,
    type: 'stack',
  });
});

test("doesn't handle replace if source key isn't present when target is specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('baz'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { foo: 21 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('baz', { bar: 29 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { foo: 21, bar: 29 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.foo,
      qux: ({ params }) => params?.fux,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar' }],
      },
      StackActions.push('bar', { foo: 'a' }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
      { key: 'bar-test', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('ensure unique ID is only per route name for push', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux', params: { test: 'a' } },
      { key: 'baz-test', name: 'baz', params: { foo: 'a' } },
      { key: 'bar-test', name: 'bar', params: { foo: 'a' } },
    ],
  });
});

test('adds path on navigate if provided', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 } },
        ],
      },

      CommonActions.navigate({
        name: 'bar',
        path: '/foo/bar',
      }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', path: '/foo/bar' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', params: { answer: 42 }, path: '/foo/bar' },
        ],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar',
        name: 'bar',
        params: { fruit: 'orange' },
        path: '/foo/baz',
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [{ key: 'bar', name: 'bar', params: { answer: 42 } }],
      },
      CommonActions.navigate({
        name: 'baz',
        path: '/foo/bar',
      }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      {
        key: 'baz-test',
        name: 'baz',
        path: '/foo/bar',
      },
    ],
  });
});

test("doesn't remove existing path on navigate if not provided", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'bar', name: 'bar', path: '/foo/bar' },
        ],
      },

      CommonActions.navigate({
        name: 'bar',
        params: { answer: 42 },
      }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 }, path: '/foo/bar' },
    ],
  });
});

test('handles popTo action', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'qux-test',
        name: 'qux',
        params: { answer: 42 },
      },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz', params: { answer: 42 } }],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 0,
    preloadedRoutes: [],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    preloadedRoutes: [],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
    ],
    stale: false,
    type: 'stack',
  });
});

test('handles popTo when source and target match a route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    preloadedRoutes: [],
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routes: [
      { key: 'foo', name: 'foo' },
      { key: 'qux-test', name: 'qux', params: { answer: 42 } },
    ],
    stale: false,
    type: 'stack',
  });
});

test("doesn't handle popTo if source key isn't present when target is specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routes: [
          { key: 'foo', name: 'foo' },
          { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
          { key: 'baz', name: 'baz' },
        ],
        preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 2,
    preloadedRoutes: [
      { key: 'bar-test', name: 'bar', params: { color: 'test' } },
    ],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'qux', name: 'qux' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-test',
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
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [
      { key: 'bar-test', name: 'bar', params: { answer: 43, color: 'test' } },
    ],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42, toBe: 'notMerged' },
      },
      { key: 'baz', name: 'baz' },
    ],
  });
});

test('uses preloaded route when pushing a route with the same name', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {},
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [
          {
            key: 'bar-test',
            name: 'bar',
          },
          { key: 'qux-some', name: 'qux' },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-test',
            name: 'bar',
          },
        ],
      },

      StackActions.push('qux'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [
      {
        key: 'bar-test',
        name: 'bar',
      },
    ],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-test',
        name: 'bar',
      },
      { key: 'qux-some', name: 'qux' },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-test',
            name: 'bar',
          },
          { key: 'qux-some', name: 'qux' },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'qux-some', name: 'qux' },
          {
            key: 'bar-test',
            name: 'bar',
          },
        ],
      },

      StackActions.push('qux'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [
      {
        key: 'bar-test',
        name: 'bar',
      },
    ],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-test',
        name: 'bar',
      },
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [
          {
            key: 'bar-test',
            params: {
              answer: 41,
            },
            name: 'bar',
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'qux-test',
            name: 'qux',
          },
        ],
      },

      StackActions.push('bar', { answer: 41 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        preloadedRoutes: [
          {
            key: 'bar-some',
            params: {
              answer: 42,
              toBe: 'notMerged',
            },
            name: 'bar',
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'qux-test',
            name: 'qux',
          },
        ],
      },

      StackActions.push('bar', { answer: 41 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [
      {
        key: 'bar-some',
        params: {
          answer: 42,
          toBe: 'notMerged',
        },
        name: 'bar',
      },
    ],
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

test('uses preloaded route when replacing current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeParamList: {
      bar: { color: 'test' },
    },
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.replace('bar'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.replace('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 99 },
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popTo('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 99 },
      },
    ],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { color: 'test', answer: 42 },
      },
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popTo('bar'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popTo('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        preloadedRoutes: [
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 99 },
          },
        ],
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
        ],
      },
      StackActions.popTo('bar', { answer: 42 }),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    preloadedRoutes: [
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 99 },
      },
    ],
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { color: 'test', answer: 42 },
      },
    ],
  });
});
