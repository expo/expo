import { describe, expect, jest, test } from '@jest/globals';

import {
  CommonActions,
  type ParamListBase,
  type RouterConfigOptions,
  StackActions,
  StackRouter,
  type StackNavigationState,
} from '..';
import { createInitialState } from '../../core/createInitialState';

jest.mock('nanoid/non-secure', () => ({ nanoid: () => 'test' }));

describe('state without router type', () => {
  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz'],
    routeGetIdList: { bar: ({ params }) => params?.id },
  };
  const createState = (index = 1): StackNavigationState<ParamListBase> => ({
    stale: false,
    key: 'root',
    index,
    routeNames: options.routeNames,
    routes: [
      { key: 'bar', name: 'bar', params: { id: 'one' } },
      { key: 'baz', name: 'baz' },
    ],
  });

  test.each([
    StackActions.push('bar'),
    CommonActions.navigate('bar'),
    CommonActions.goBack(),
    CommonActions.preload('bar', { id: 'one' }),
    CommonActions.preload('baz', { id: 'new' }),
    { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: options.routeNames } } as const,
  ])('$type returns stack state', (action) => {
    expect(StackRouter({}).getStateForAction(createState(), action, options)?.type).toBe('stack');
  });

  test('stamps stack state on route focus', () => {
    expect(StackRouter({}).getStateForRouteFocus(createState(0), 'baz').type).toBe('stack');
  });

  test('stamps complete RESET state', () => {
    const state = createState();
    const result = StackRouter({}).getStateForAction(
      state,
      CommonActions.reset({ ...state, index: 0, routes: [state.routes[0]!] }),
      options
    );

    expect(result?.type).toBe('stack');
  });

  test('preserves the type from complete RESET state', () => {
    const state = createState();
    const result = StackRouter({}).getStateForAction(
      state,
      CommonActions.reset({ ...state, type: 'stack' }),
      options
    );

    expect(result?.type).toBe('stack');
  });

  test('passes partial RESET state through unchanged', () => {
    const partialState = { routes: [{ name: 'bar' }] };
    const result = StackRouter({}).getStateForAction(
      createState(),
      CommonActions.reset(partialState),
      options
    );

    expect(result).toBe(partialState);
  });
});

test('gets rehydrated state from partial state', () => {
  const router = StackRouter({});

  const options: RouterConfigOptions = {
    routeNames: ['bar', 'baz', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getRehydratedState(
      {
        index: 1,
        routes: [
          { key: 'bar-0', name: 'bar' },
          { key: 'qux-1', name: 'qux' },
          { name: 'baz', key: 'baz-test' },
        ],
      },
      options
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'qux-1', name: 'qux' },
      { name: 'baz', key: 'baz-test' },
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
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      { key: 'baz-1', name: 'baz' },
      { key: 'qux-2', name: 'qux' },
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
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false,
    type: 'stack',
  });
});

test('treats all routes as active when rehydrating state without an index', () => {
  const router = StackRouter({});

  expect(
    router.getRehydratedState(
      {
        routes: [
          { key: 'bar-0', name: 'bar' },
          {
            key: 'baz-1',
            name: 'baz',
            params: { id: '42' },
            path: '/42',
            state: { routes: [{ name: 'qux' }] },
          },
        ],
      },
      {
        routeNames: ['bar', 'baz'],
        routeGetIdList: {},
      }
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    routeNames: ['bar', 'baz'],
    routes: [
      { key: 'bar-0', name: 'bar' },
      {
        key: 'baz-1',
        name: 'baz',
        params: { id: '42' },
        path: '/42',
        state: { routes: [{ name: 'qux' }] },
      },
    ],
    stale: false,
    type: 'stack',
  });
});

test("doesn't rehydrate state if it's not stale", () => {
  const router = StackRouter({});

  const state = {
    index: 0,
    key: 'stack-test',
    routeNames: ['bar', 'baz', 'qux'],
    routes: [{ key: 'bar-test', name: 'bar' }],
    stale: false as const,
    type: 'stack' as const,
  };

  expect(
    router.getRehydratedState(state, {
      routeNames: [],
      routeGetIdList: {},
    })
  ).toBe(state);
});

test('keeps the focused route when rehydration filters an earlier active route', () => {
  const result = StackRouter({}).getRehydratedState(
    {
      index: 1,
      routes: [
        { key: 'removed', name: 'removed' },
        { key: 'focused', name: 'focused' },
        { key: 'preloaded', name: 'preloaded' },
      ],
    },
    {
      routeNames: ['focused', 'preloaded'],
      routeGetIdList: {},
    }
  );

  expect(result.index).toBe(0);
  expect(result.routes.map((route) => route.key)).toEqual(['focused', 'preloaded']);
});

test('gets state on route names change', () => {
  const router = StackRouter({});

  expect(
    router.getStateForAction(
      {
        index: 2,
        key: 'stack-test',
        routeNames: ['bar', 'baz', 'qux'],
        routes: [
          { key: 'bar-test', name: 'bar' },
          { key: 'baz-test', name: 'baz', params: { answer: 42 } },
          { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
        ],
        stale: false,
        type: 'stack',
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['qux', 'baz', 'foo', 'fiz'] } },
      {
        routeNames: ['qux', 'baz', 'foo', 'fiz'],
        routeGetIdList: {},
      }
    )
  ).toEqual({
    index: 1,
    key: 'stack-test',
    routeNames: ['qux', 'baz', 'foo', 'fiz'],
    routes: [
      { key: 'baz-test', name: 'baz', params: { answer: 42 } },
      { key: 'qux-test', name: 'qux', params: { name: 'Jane' } },
    ],
    stale: false,
    type: 'stack',
  });

  expect(
    router.getStateForAction(
      {
        index: 1,
        key: 'stack-test',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
        type: 'stack',
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['baz', 'qux'] } },
      {
        routeNames: ['baz', 'qux'],
        routeGetIdList: {},
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'baz-test', name: 'baz' }],
    stale: false,
    type: 'stack',
  });
});

test('gets state on route names change with initialRouteName', () => {
  const router = StackRouter({ initialRouteName: 'qux' });

  expect(
    router.getStateForAction(
      {
        index: 1,
        key: 'stack-test',
        routeNames: ['foo', 'bar'],
        routes: [
          { key: 'foo-test', name: 'foo' },
          { key: 'bar-test', name: 'bar' },
        ],
        stale: false,
        type: 'stack',
      },
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['baz', 'qux'] } },
      {
        routeNames: ['baz', 'qux'],
        routeGetIdList: {},
      }
    )
  ).toEqual({
    index: 0,
    key: 'stack-test',
    routeNames: ['baz', 'qux'],
    routes: [{ key: 'qux-test', name: 'qux' }],
    stale: false,
    type: 'stack',
  });
});

test('returns the same complete stack state when route names already match', () => {
  const router = StackRouter({});
  const state = {
    ...createInitialState<StackNavigationState<ParamListBase>>({
      routeNames: ['bar', 'baz'],
    }),
    type: 'stack' as const,
  };

  expect(
    router.getStateForAction(
      state,
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['bar', 'baz'] } },
      { routeNames: ['bar', 'baz'], routeGetIdList: {} }
    )
  ).toBe(state);
});

test('promotes a surviving preloaded route when every active route is removed', () => {
  const router = StackRouter({});
  const state = {
    stale: false as const,
    type: 'stack' as const,
    key: 'stack-test',
    index: 0,
    routeNames: ['active', 'preloaded', 'removed'],
    routes: [
      { key: 'active-test', name: 'active' },
      { key: 'preloaded-existing', name: 'preloaded' },
      { key: 'removed-test', name: 'removed' },
    ],
  };

  expect(
    router.getStateForAction(
      state,
      { type: 'ROUTE_NAMES_CHANGED', payload: { routeNames: ['preloaded', 'new'] } },
      { routeNames: ['preloaded', 'new'], routeGetIdList: {} }
    )
  ).toEqual({
    ...state,
    index: 0,
    routeNames: ['preloaded', 'new'],
    routes: [{ key: 'preloaded-existing', name: 'preloaded' }],
  });
});

test('handles navigate action', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
        index: 3,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'bar-a', name: 'bar', params: { foo: 'a' } },
      { key: 'bar-b', name: 'bar', params: { foo: 'b' } },
    ],
  });
});

test('handles go back action', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [{ key: 'baz', name: 'baz' }],
  });
});

test('replaces focused screen with replace', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test('replaces active screen with replace', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
    routeNames: ['foo', 'bar', 'baz', 'qux'],
  });
});

test("handles replace if source key isn't present but target is not specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: undefined },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'bar', name: 'bar' },
      { key: 'baz-test', name: 'baz', params: { bar: 29 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: undefined },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { fruit: 'orange' } },
    ],
  });
});

test('merges params on popTo to an existing screen if merge: true', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 2,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar',
        name: 'bar',
        params: { fruit: 'orange', answer: 42 },
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'baz',
        name: 'baz',
        params: { test: 99, color: 'black' },
      },
    ],
  });
});

test("handles popTo if source key isn't present but target is not specified", () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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

test('handles popTo when source and target match a route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['foo', 'bar', 'baz', 'qux'],
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
    routeGetIdList: {
      bar: ({ params }) => params?.answer,
    },
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        key: 'root',
        index: 2,
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      { key: 'bar', name: 'bar', params: { answer: 42 } },
      { key: 'qux', name: 'qux' },
      { key: 'bar-test', name: 'bar', params: undefined },
    ],
  });

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-existing',
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-existing',
        name: 'bar',
        params: { answer: 42, something: 'else' },
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-existing',
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-existing',
        name: 'bar',
        params: { answer: 42, toBe: 'notMerged' },
      },
      { key: 'baz', name: 'baz' },
      { key: 'bar-test', name: 'bar', params: { answer: 43 } },
    ],
  });
});

test('uses preloaded route when pushing a route with the same name', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 0,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'bar-active',
            name: 'bar',
          },
          {
            key: 'bar-preloaded',
            name: 'bar',
          },
          { key: 'qux-some', name: 'qux' },
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'bar-active',
        name: 'bar',
      },
      { key: 'qux-some', name: 'qux', path: undefined, params: undefined },
      {
        key: 'bar-preloaded',
        name: 'bar',
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'qux-active', name: 'qux' },
          {
            key: 'bar-active',
            name: 'bar',
          },
          {
            key: 'bar-preloaded',
            name: 'bar',
          },
          { key: 'qux-preloaded', name: 'qux' },
        ],
      },

      StackActions.push('qux'),
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 2,
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      {
        key: 'qux-active',
        name: 'qux',
      },
      {
        key: 'bar-active',
        name: 'bar',
      },
      { key: 'qux-preloaded', name: 'qux', path: undefined, params: undefined },
      {
        key: 'bar-preloaded',
        name: 'bar',
      },
    ],
  });
});

test('uses preloaded route when pushing a route with the same ID', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'qux-test',
            name: 'qux',
          },
          {
            key: 'bar-test',
            params: {
              answer: 41,
            },
            name: 'bar',
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux' },
      {
        key: 'bar-test',
        params: {
          answer: 41,
        },
        name: 'bar',
      },
    ],
  });
});

test('partitions active history from multiple preloaded routes', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['a', 'b', 'p1', 'p2', 'c'],
    routeGetIdList: {},
  };
  const state = {
    stale: false as const,
    type: 'stack' as const,
    key: 'root',
    index: 1,
    routeNames: options.routeNames,
    routes: [
      { key: 'a-key', name: 'a', state: { index: 0, routes: [] } },
      { key: 'b-key', name: 'b' },
      { key: 'p1-key', name: 'p1', params: { preload: 1 } },
      { key: 'p2-key', name: 'p2', params: { preload: 2 } },
    ],
  };

  expect(router.getStateForAction(state, StackActions.push('p2', { preload: 2 }), options)).toEqual(
    {
      ...state,
      index: 2,
      routes: [state.routes[0], state.routes[1], state.routes[3], state.routes[2]],
    }
  );

  expect(
    router.getStateForAction(
      state,
      CommonActions.navigate({ name: 'p2', params: { preload: 2 }, pop: true }),
      options
    )
  ).toEqual({
    ...state,
    index: 2,
    routes: [state.routes[0], state.routes[1], state.routes[3], state.routes[2]],
  });

  expect(router.getStateForAction(state, StackActions.push('c'), options)).toEqual({
    ...state,
    index: 2,
    routes: [
      state.routes[0],
      state.routes[1],
      { key: 'c-test', name: 'c', params: undefined },
      state.routes[2],
      state.routes[3],
    ],
  });

  expect(router.getStateForAction(state, StackActions.pop(), options)).toEqual({
    ...state,
    index: 0,
    routes: [state.routes[0], state.routes[2], state.routes[3]],
  });
});

test('does not use preloaded route when pushing a route with different ID', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          {
            key: 'qux-test',
            name: 'qux',
          },
          {
            key: 'bar-some',
            params: {
              answer: 42,
              toBe: 'notMerged',
            },
            name: 'bar',
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'qux-test', name: 'qux' },
      {
        key: 'bar-test',
        params: {
          answer: 41,
        },
        name: 'bar',
      },
      {
        key: 'bar-some',
        params: {
          answer: 42,
          toBe: 'notMerged',
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
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 99 },
          },
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42 },
      },
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 99 },
      },
    ],
  });
});

test('uses preloaded route with the same name when popTo replaces current route', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['baz', 'bar', 'qux'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 1,
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 42 },
          },
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
        routeNames: ['baz', 'bar', 'qux'],
        routes: [
          { key: 'baz', name: 'baz' },
          { key: 'qux', name: 'qux' },
          {
            key: 'bar-preloaded',
            name: 'bar',
            params: { answer: 99 },
          },
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
    routeNames: ['baz', 'bar', 'qux'],
    routes: [
      { key: 'baz', name: 'baz' },
      {
        key: 'bar-test',
        name: 'bar',
        params: { answer: 42 },
      },
      {
        key: 'bar-preloaded',
        name: 'bar',
        params: { answer: 99 },
      },
    ],
  });
});

test('removes routes by name while preserving the focused route instance', () => {
  const router = StackRouter({});
  const options: RouterConfigOptions = {
    routeNames: ['index', 'secret', 'other'],
    routeGetIdList: {},
  };

  expect(
    router.getStateForAction(
      {
        stale: false,
        type: 'stack',
        key: 'root',
        index: 3,
        routeNames: ['index', 'secret', 'other'],
        routes: [
          { key: 'index', name: 'index' },
          { key: 'secret-old', name: 'secret' },
          { key: 'other', name: 'other' },
          { key: 'secret-current', name: 'secret' },
        ],
      },
      { type: 'REMOVE_ROUTES', payload: { routeNames: ['secret', 'other'] } },
      options
    )
  ).toEqual({
    stale: false,
    type: 'stack',
    key: 'root',
    index: 1,
    routeNames: ['index', 'secret', 'other'],
    routes: [
      { key: 'index', name: 'index' },
      { key: 'secret-current', name: 'secret' },
    ],
  });
});

test.each(['secret', 'nonExisting'])(
  'handles route %p removal without changing state when no history entries match',
  (name: string) => {
    const router = StackRouter({});
    const state = {
      stale: false as const,
      type: 'stack' as const,
      key: 'root',
      index: 1,
      routeNames: ['index', 'secret'],
      routes: [
        { key: 'index', name: 'index' },
        { key: 'secret', name: 'secret' },
      ],
    };

    expect(
      router.getStateForAction(
        state,
        { type: 'REMOVE_ROUTES', payload: { routeNames: [name] } },
        {
          routeNames: state.routeNames,
          routeGetIdList: {},
        }
      )
    ).toBe(state);
  }
);

test('getStateForDeclaredRoutes focuses the surviving top of the stack', () => {
  const router = StackRouter({});
  const state: StackNavigationState<ParamListBase> = {
    stale: false,
    type: 'stack',
    key: 'stack-test',
    index: 2,
    routeNames: ['bar', 'baz', 'qux'],
    routes: [
      { key: 'bar-test', name: 'bar' },
      { key: 'baz-test', name: 'baz' },
      { key: 'qux-test', name: 'qux' },
    ],
  };

  // `qux` is the focused top; dropping it leaves `baz` on top, not `bar`.
  expect(router.getStateForDeclaredRoutes(state, ['bar', 'baz'])).toEqual({
    ...state,
    index: 1,
    routes: [state.routes[0], state.routes[1]],
  });
});

test('getStateForDeclaredRoutes returns the same state when every route is declared', () => {
  const router = StackRouter({});
  const state = createInitialState<StackNavigationState<ParamListBase>>({
    routeNames: ['bar', 'baz'],
  });

  expect(router.getStateForDeclaredRoutes(state, ['bar', 'baz'])).toBe(state);
});
