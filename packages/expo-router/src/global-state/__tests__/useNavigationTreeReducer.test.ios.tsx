import { act, renderHook } from '@testing-library/react-native';
import { useLayoutEffect } from 'react';

import type { NavigationAction, NavigationState } from '../../react-navigation/routers';
import { getNavigateAction } from '../getNavigationAction';
import type { NavigationTransactionCancellations } from '../navigationActionResult';
import type { RouterRegistry } from '../routerRegistry';
import type { LinkToOptions } from '../types';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';
import { node } from './__fixtures__/routeNode';
import { entry } from './__fixtures__/routerEntry';

jest.mock('../getNavigationAction', () => ({
  getNavigateAction: jest.fn(),
}));

const mockGetNavigateAction = getNavigateAction as jest.MockedFunction<typeof getNavigateAction>;

const initialState: NavigationState = {
  stale: false,
  routeKeySeq: 0,
  key: 'root',
  index: 0,
  routeNames: ['first', 'second', 'third'],
  routes: [
    { key: 'first', name: 'first' },
    { key: 'second', name: 'second' },
    { key: 'third', name: 'third' },
  ],
};

async function renderReducer({
  state = initialState,
  registry,
  routesWithRemovalPrevented = new Set(),
  cancelledTransactions,
  transactionScope,
}: {
  state?: NavigationState;
  registry: RouterRegistry;
  routesWithRemovalPrevented?: ReadonlySet<string>;
  cancelledTransactions?: NavigationTransactionCancellations;
  transactionScope?: object;
}) {
  const reports: NonNullable<ReturnType<typeof useNavigationTreeReducer>['report']>[] = [];
  const committedStates: NavigationState[] = [];
  const result = await renderHook<
    ReturnType<typeof useNavigationTreeReducer>,
    {
      registry: RouterRegistry;
      routesWithRemovalPrevented: ReadonlySet<string>;
      cancelledTransactions?: NavigationTransactionCancellations;
      transactionScope?: object;
    }
  >(
    ({ registry, routesWithRemovalPrevented, cancelledTransactions, transactionScope }) => {
      const reducer = useNavigationTreeReducer({
        initialState: state,
        cancelledTransactions,
        transactionScope,
        registry,
        routesWithRemovalPrevented,
      });
      if (reducer.report) {
        reports.push(reducer.report);
      }
      useLayoutEffect(() => {
        committedStates.push(reducer.state);
      });
      return reducer;
    },
    {
      initialProps: {
        registry,
        routesWithRemovalPrevented,
        cancelledTransactions,
        transactionScope,
      },
    }
  );
  return { ...result, committedStates, reports };
}

test('reports and vetoes removal of a prevented route', async () => {
  const action = { type: 'REMOVE' };
  const result = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: 0, routes: state.routes.slice(0, 1) },
          affectedRouteKey: state.routes[0]!.key,
        })),
      ],
    ]),
    routesWithRemovalPrevented: new Set(['third']),
  });

  await act(() => result.result.current.handleAction(action));

  expect(result.result.current.state).toBe(initialState);
  expect(result.reports.at(-1)).toMatchObject({
    events: [{ type: 'prevented-routes', routeKeys: ['third'], action }],
  });
  expect(result.result.current.report).toMatchObject({
    events: [{ type: 'prevented-routes', routeKeys: ['third'], action }],
  });
});

test('commits removal and reports removed routes when none are prevented', async () => {
  const action = { type: 'REMOVE' };
  const result = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: 0, routes: state.routes.slice(0, 1) },
          affectedRouteKey: state.routes[0]!.key,
        })),
      ],
    ]),
  });

  await act(() => result.result.current.handleAction(action));

  expect(result.result.current.state.routes).toHaveLength(1);
  expect(result.reports.at(-1)).toMatchObject({
    events: [
      { type: 'removed-routes', routeKeys: ['third', 'second'], action },
      { type: 'action-dispatched', action },
    ],
  });
});

test('does not let a preloaded route prevent removal', async () => {
  const tabState: NavigationState = {
    ...initialState,
    type: 'tab',
    index: 0,
    routes: initialState.routes
      .slice(0, 2)
      .map((route, index) => (index === 1 ? { ...route, isPreloaded: true } : route)),
  };
  const result = await renderReducer({
    state: tabState,
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, routes: state.routes.slice(0, 1) },
          affectedRouteKey: state.routes[0]!.key,
        })),
      ],
    ]),
    routesWithRemovalPrevented: new Set(['second']),
  });

  await act(() => result.result.current.handleAction({ type: 'REMOVE_PRELOAD' }));

  expect(result.result.current.state.routes).toHaveLength(1);
  expect(result.reports.at(-1)?.events).toEqual([
    expect.objectContaining({
      type: 'action-dispatched',
      action: { type: 'REMOVE_PRELOAD' },
    }),
  ]);
});

test('prevents moving an active route into the preloaded region', async () => {
  const stackState: NavigationState = {
    ...initialState,
    type: 'stack',
    index: 2,
  };
  const result = await renderReducer({
    state: stackState,
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: {
            ...state,
            index: 0,
            routes: state.routes.map((route, index) =>
              index > 0 ? { ...route, isPreloaded: true } : route
            ),
          },
          affectedRouteKey: state.routes[0]!.key,
        })),
      ],
    ]),
    routesWithRemovalPrevented: new Set(['second']),
  });

  await act(() => result.result.current.handleAction({ type: 'RESET_INDEX' }));

  expect(result.result.current.state).toBe(stackState);
  expect(result.reports.at(-1)?.events).toEqual([
    {
      id: 0,
      type: 'prevented-routes',
      routeKeys: ['second'],
      action: { type: 'RESET_INDEX' },
    },
  ]);
});

test('does not veto route name changes', async () => {
  const action = { type: 'ROUTE_NAMES_CHANGED' };
  const result = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: 0, routes: state.routes.slice(0, 1) },
          affectedRouteKey: state.routes[0]!.key,
        })),
      ],
    ]),
    routesWithRemovalPrevented: new Set(['third']),
  });

  await act(() => result.result.current.handleAction(action));

  expect(result.result.current.state.routes).toHaveLength(1);
  expect(result.reports.at(-1)?.events).toEqual([
    { id: 0, type: 'removed-routes', routeKeys: ['third', 'second'], action },
    expect.objectContaining({ id: 1, type: 'action-dispatched', action }),
  ]);
});

it('reduces consecutive actions against accumulated state with one committed update', async () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: state.index + 1 },
    affectedRouteKey: state.routes[state.index + 1]!.key,
  }));
  const result = await renderReducer({
    registry: new Map([['root', entry(reduce)]]),
  });

  const firstAction = { type: 'NEXT_FIRST' };
  const secondAction = { type: 'NEXT_SECOND' };
  await act(() => {
    result.result.current.handleAction(firstAction);
    result.result.current.handleAction(secondAction);
  });

  expect(reduce).toHaveBeenCalledTimes(2);
  expect(reduce.mock.calls[1]![0].index).toBe(1);
  expect(result.result.current.state.index).toBe(2);
  expect(result.reports.at(-1)?.events).toEqual([
    expect.objectContaining({
      id: 0,
      type: 'action-dispatched',
      action: firstAction,
    }),
    expect.objectContaining({
      id: 1,
      type: 'action-dispatched',
      action: secondAction,
    }),
  ]);
});

it('assigns increasing ids to events across actions', async () => {
  const result = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: state.index + 1 },
          affectedRouteKey: state.routes[state.index + 1]!.key,
        })),
      ],
    ]),
  });

  await act(() => result.result.current.handleAction({ type: 'FIRST' }));
  await act(() => result.result.current.handleAction({ type: 'SECOND' }));

  expect(result.result.current.report?.events.map((event) => event.id)).toEqual([0, 1]);
});

it('consumes only the listed report events', async () => {
  const result = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: state.index + 1 },
          affectedRouteKey: state.routes[state.index + 1]!.key,
        })),
      ],
    ]),
  });

  await act(() => {
    result.result.current.handleAction({ type: 'FIRST' });
    result.result.current.handleAction({ type: 'SECOND' });
  });
  await act(() => result.result.current.consumeReportEvents([0]));

  expect(result.result.current.report?.events.map((event) => event.id)).toEqual([1]);

  const report = result.result.current.report;
  await act(() => result.result.current.consumeReportEvents([99]));
  expect(result.result.current.report).toBe(report);

  await act(() => result.result.current.consumeReportEvents([1]));
  expect(result.result.current.report).toBeUndefined();
});

it('logs an error for stale focused state after commit', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const reduce = jest.fn((state: NavigationState) => {
    // `NavigationState` excludes stale committed state, which this test deliberately creates.
    const staleState = {
      ...state,
      routes: [{ ...state.routes[0]!, state: { ...state, stale: true as const } }],
    } as unknown as NavigationState;
    return { state: staleState, affectedRouteKey: state.routes[0]!.key };
  });
  const result = await renderReducer({ registry: new Map([['root', entry(reduce)]]) });

  await act(() => result.result.current.handleAction({ type: 'STALE' }));

  expect(error).toHaveBeenCalledWith('Detected stale state. This is likely a bug in Expo Router.');
  process.env.NODE_ENV = nodeEnv;
  error.mockRestore();
});

it('logs an error for focused state without an index after commit', async () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  const reduce = jest.fn((state: NavigationState) => {
    // `NavigationState` excludes incomplete committed state, which this test deliberately creates.
    const incompleteState = {
      ...state,
      routes: [
        {
          ...state.routes[0]!,
          state: {
            stale: false,
            routeKeySeq: state.routeKeySeq,
            key: state.key,
            routeNames: state.routeNames,
            routes: state.routes,
          },
        },
      ],
    } as unknown as NavigationState;
    return { state: incompleteState, affectedRouteKey: state.routes[0]!.key };
  });
  const result = await renderReducer({
    registry: new Map([['root', entry(reduce)]]),
  });

  await act(() => result.result.current.handleAction({ type: 'INCOMPLETE' }));

  expect(error).toHaveBeenCalledWith('Detected stale state. This is likely a bug in Expo Router.');
  process.env.NODE_ENV = nodeEnv;
  error.mockRestore();
});

it('reduces consecutive queued intents against accumulated state', async () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: state.index + 1 },
    affectedRouteKey: state.routes[state.index + 1]!.key,
  }));
  const result = await renderReducer({
    registry: new Map([['root', entry(reduce)]]),
  });

  await act(() => {
    result.result.current.processIntent({
      type: 'ACTION',
      actionId: 0,
      payload: { action: { type: 'NEXT' } },
    });
    result.result.current.processIntent({
      type: 'ACTION',
      actionId: 0,
      payload: { action: { type: 'NEXT' } },
    });
  });

  expect(reduce).toHaveBeenCalledTimes(2);
  expect(reduce.mock.calls[1]![0].index).toBe(1);
  expect(result.result.current.state.index).toBe(2);
});

it('uses the registry from the render that reduces an operation', async () => {
  const firstReduce = jest.fn(() => null);
  const secondReduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: 1 },
    affectedRouteKey: state.routes[1]!.key,
  }));
  const result = await renderReducer({ registry: new Map([['root', entry(firstReduce)]]) });
  const processIntent = result.result.current.processIntent;

  await result.rerender({
    registry: new Map([['root', entry(secondReduce)]]),
    routesWithRemovalPrevented: new Set(),
  });
  await act(() =>
    processIntent({
      type: 'ACTION',
      actionId: 0,
      payload: { action: { type: 'USE_CURRENT_REGISTRY' } },
    })
  );

  expect(result.result.current.processIntent).toBe(processIntent);
  expect(firstReduce).not.toHaveBeenCalled();
  expect(secondReduce).toHaveBeenCalledTimes(1);
  expect(result.result.current.state.index).toBe(1);
});

it('uses removal prevention from the render that reduces an operation', async () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, routes: state.routes.slice(0, 1) },
    affectedRouteKey: state.routes[0]!.key,
  }));
  const result = await renderReducer({ registry: new Map([['root', entry(reduce)]]) });
  const processIntent = result.result.current.processIntent;

  await result.rerender({
    registry: new Map([['root', entry(reduce)]]),
    routesWithRemovalPrevented: new Set(['third']),
  });
  await act(() =>
    processIntent({ type: 'ACTION', actionId: 0, payload: { action: { type: 'REMOVE' } } })
  );

  expect(result.result.current.state).toBe(initialState);
  expect(result.result.current.report?.events).toEqual([
    expect.objectContaining({ type: 'prevented-routes', routeKeys: ['third'] }),
  ]);
});

it('computes a queued action from accumulated state', async () => {
  const tabState: NavigationState = {
    ...initialState,
    type: 'tab',
    routeNames: ['first', 'second'],
    routes: [
      { key: 'first', name: 'first', state: { ...initialState, key: 'first-stack' } },
      { key: 'second', name: 'second', state: { ...initialState, key: 'second-stack' } },
    ],
  };
  const reduce = jest.fn((state: NavigationState, action: NavigationAction) => {
    if (action.type === 'FOCUS_SECOND') {
      return { state: { ...state, index: 1 }, affectedRouteKey: state.routes[1]!.key };
    }
    if (action.type === 'JUMP_TO' || action.type === 'NAVIGATE') {
      return { state: { ...state, index: 0 }, affectedRouteKey: state.routes[0]!.key };
    }
    return null;
  });
  const result = await renderReducer({
    state: tabState,
    registry: new Map([['root', entry(reduce)]]),
  });

  await act(() => {
    result.result.current.processIntent({
      type: 'ACTION',
      actionId: 0,
      payload: { action: { type: 'FOCUS_SECOND' } },
    });
    result.result.current.processIntent({
      type: 'COMPUTED_ACTION',
      actionId: 0,
      payload: {
        originKey: 'root',
        compute: (state) => ({
          type: state.index === 1 ? 'JUMP_TO' : 'NAVIGATE',
          payload: { name: 'first' },
        }),
      },
    });
  });

  expect(reduce).toHaveBeenCalledTimes(2);
  expect(reduce.mock.calls[1]![0].index).toBe(1);
  expect(reduce.mock.calls[1]![1].type).toBe('JUMP_TO');
  expect(result.result.current.state.index).toBe(0);
});

it('warns and keeps the state when computing a queued action throws', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const result = await renderReducer({ registry: new Map([['root', entry(() => null)]]) });

  await act(() =>
    result.result.current.processIntent({
      type: 'COMPUTED_ACTION',
      actionId: 0,
      payload: {
        compute() {
          throw new Error('boom');
        },
      },
    })
  );

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'));
  expect(result.result.current.state).toBe(initialState);
  warn.mockRestore();
});

it('warns for direct navigation actions carrying a screen param', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const result = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state,
          affectedRouteKey: state.routes[state.index]!.key,
        })),
      ],
    ]),
  });

  await act(() => {
    result.result.current.handleAction({
      type: 'NAVIGATE',
      payload: { name: 'first', params: { screen: 'nested' } },
    });
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('`screen` param'));
  warn.mockRestore();
});

it('reports an action dispatched before its router registers as unhandled', async () => {
  const result = await renderReducer({ registry: new Map() });
  const action = { type: 'TEST' };

  await act(() => result.result.current.handleAction(action));

  expect(result.result.current.report?.events).toEqual([
    { id: 0, type: 'unhandled-action', action },
  ]);
  expect(result.result.current.state).toBe(initialState);
});

it('does not report an unhandled action in production', async () => {
  const nodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const result = await renderReducer({ registry: new Map() });

    await act(() => result.result.current.handleAction({ type: 'TEST' }));

    expect(result.result.current.report).toBeUndefined();
    expect(result.result.current.state).toBe(initialState);
  } finally {
    if (nodeEnv === undefined) {
      Reflect.deleteProperty(process.env, 'NODE_ENV');
    } else {
      process.env.NODE_ENV = nodeEnv;
    }
  }
});

it('reports a later action as unhandled after a same-batch reset changes the state key', async () => {
  const registryEntry = entry((state, action) =>
    action.type === 'RESET_KEY'
      ? {
          state: { ...state, key: 'next-root' },
          affectedRouteKey: state.routes[0]!.key,
        }
      : null
  );
  const result = await renderReducer({
    registry: new Map([['root', registryEntry]]),
  });

  await act(() => {
    result.result.current.handleAction({ type: 'RESET_KEY' });
    result.result.current.handleAction({ type: 'NEXT' });
  });

  expect(result.result.current.report?.events).toEqual([
    expect.objectContaining({ id: 0, type: 'action-dispatched', action: { type: 'RESET_KEY' } }),
    { id: 1, type: 'unhandled-action', action: { type: 'NEXT' } },
  ]);
  expect(result.result.current.state.key).toBe('next-root');
});

it('resets a state slice when its router unregisters', async () => {
  const routeNode = node('root', [node('first'), node('second'), node('third')], 'second');
  const registryEntry = { ...entry(() => null), routeNode };
  const result = await renderReducer({
    registry: new Map([['root', registryEntry]]),
  });
  result.committedStates.length = 0;

  await result.rerender({
    registry: new Map(),
    routesWithRemovalPrevented: new Set(),
  });

  expect(result.result.current.state).toMatchObject({
    index: 0,
    routeNames: ['second', 'first', 'third'],
    routes: [{ name: 'second' }],
  });
  expect(result.committedStates).toEqual([result.result.current.state]);
});

it('resets a state slice when its router type changes', async () => {
  const result = await renderReducer({ registry: new Map() });

  await act(() => result.result.current.resetNavigator('root', 'tab'));

  expect(result.result.current.state).toEqual({
    stale: false,
    routeKeySeq: 0,
    key: 'root',
    type: 'tab',
    index: 0,
    routeNames: ['first', 'second', 'third'],
    routes: [{ key: 'first', name: 'first' }],
  });
});

it('ignores a router type change for an unknown state key', async () => {
  const result = await renderReducer({ registry: new Map() });

  await act(() => result.result.current.resetNavigator('missing', 'tab'));

  expect(result.result.current.state).toBe(initialState);
});

it('does not reset a state slice when its router entry is replaced', async () => {
  const result = await renderReducer({
    registry: new Map([['root', entry(() => null)]]),
  });

  await result.rerender({
    registry: new Map([['root', entry(() => null)]]),
    routesWithRemovalPrevented: new Set(),
  });

  expect(result.result.current.state).toBe(initialState);
});

describe('NAVIGATE_TO_HREF', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warn.mockRestore();
    mockGetNavigateAction.mockReset();
  });

  async function navigateToHref(
    result: Awaited<ReturnType<typeof renderReducer>>,
    payload: {
      href?: string;
      options?: LinkToOptions;
      originalHref?: string;
    } = {}
  ) {
    await act(() =>
      result.result.current.processIntent({
        type: 'NAVIGATE_TO_HREF',
        actionId: 0,
        payload: { href: '/second', options: {}, ...payload },
      })
    );
  }

  it('warns and keeps the state when resolving the href throws', async () => {
    mockGetNavigateAction.mockImplementation(() => {
      throw new Error('boom');
    });
    const result = await renderReducer({ registry: new Map() });

    await navigateToHref(result);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(result.result.current.state).toBe(initialState);
  });

  it('warns with the resolved href when the href is invalid', async () => {
    mockGetNavigateAction.mockReturnValue({
      status: 'invalid',
      href: '/resolved',
    });
    const result = await renderReducer({ registry: new Map() });

    await navigateToHref(result);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/resolved'));
    expect(result.result.current.state).toBe(initialState);
  });

  it('warns with the original href when the href is invalid after a redirect', async () => {
    mockGetNavigateAction.mockReturnValue({
      status: 'invalid',
      href: '/resolved',
    });
    const result = await renderReducer({ registry: new Map() });

    await navigateToHref(result, { originalHref: 'myapp://original' });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('myapp://original'));
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('/resolved'));
    expect(result.result.current.state).toBe(initialState);
  });

  it('reduces the resolved action against the current state', async () => {
    const action = { type: 'NEXT' };
    const dangerouslySingular = () => 'singular';
    mockGetNavigateAction.mockReturnValue({ status: 'action', action });
    const reduce = jest.fn((state: NavigationState, _action: NavigationAction) => ({
      state: { ...state, index: state.index + 1 },
      affectedRouteKey: state.routes[state.index + 1]!.key,
    }));
    const registry: RouterRegistry = new Map([['root', entry(reduce)]]);
    const result = await renderReducer({ registry });

    await navigateToHref(result, {
      options: {
        event: 'PUSH',
        withAnchor: true,
        dangerouslySingular,
        __internal__PreviewKey: 'preview',
      },
    });

    expect(reduce).toHaveBeenCalledTimes(1);
    expect(reduce.mock.calls[0]![1]).toBe(action);
    expect(result.result.current.state.index).toBe(1);
    expect(mockGetNavigateAction).toHaveBeenCalledWith(
      '/second',
      expect.objectContaining({ event: 'PUSH' }),
      {
        registry,
        routeNode: undefined,
        linking: undefined,
        redirects: undefined,
        routesWithRemovalPrevented: new Set(),
        browserHistoryIdPrefix: expect.any(String),
      },
      'PUSH',
      true,
      dangerouslySingular,
      'preview',
      initialState
    );
  });
});

it('throws for an incomplete initial state', async () => {
  await expect(
    async () =>
      await renderHook(() =>
        useNavigationTreeReducer({
          initialState: { routes: [{ name: 'first' }] },
          registry: new Map(),
        })
      )
  ).rejects.toThrow('incomplete initial state');
});

test('guarded actions reject a history change that reduces earlier in the same queued batch', async () => {
  const reducer = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: state.index + 1 },
          affectedRouteKey: state.routes[state.index + 1]?.key,
        })),
      ],
    ]),
  });
  const expectedState = reducer.result.current.state;
  await act(() => {
    reducer.result.current.processIntent({
      type: 'ACTION',
      payload: { action: { type: 'NEXT' } },
      actionId: 1,
    });
    reducer.result.current.processIntent({
      type: 'ACTION',
      payload: {
        action: { type: 'NEXT' },
        originKey: 'root',
        transaction: { id: 2, token: {}, expectedState },
      },
      actionId: 2,
    });
  });
  expect(reducer.result.current.state.index).toBe(1);
  expect(reducer.result.current.report?.events).toContainEqual(
    expect.objectContaining({
      type: 'action-result',
      transactionId: 2,
      result: expect.objectContaining({ status: 'cancelled' }),
    })
  );
});

test.each(['handled', 'prevented', 'noop', 'unhandled'] as const)(
  'guarded actions report %s after reduction, including unchanged state',
  async (status) => {
    const reducer = await renderReducer({
      registry: new Map([
        [
          'root',
          entry((state) =>
            status === 'unhandled'
              ? null
              : {
                  state:
                    status === 'noop'
                      ? state
                      : { ...state, index: 0, routes: state.routes.slice(0, 1) },
                  affectedRouteKey: state.routes[0]?.key,
                }
          ),
        ],
      ]),
      routesWithRemovalPrevented: status === 'prevented' ? new Set(['third']) : new Set(),
    });
    // A helper may return an equivalent declared-routes object rather than the reducer's pointer.
    const expectedState = {
      ...reducer.result.current.state,
      routes: [...reducer.result.current.state.routes],
    };
    await act(() =>
      reducer.result.current.processIntent({
        type: 'ACTION',
        payload: {
          action: { type: 'REMOVE' },
          originKey: 'root',
          transaction: { id: 7, token: {}, expectedState },
        },
        actionId: 7,
      })
    );
    const results = reducer.result.current.report?.events.filter(
      (event) => event.type === 'action-result'
    );
    expect(results).toEqual([
      expect.objectContaining({
        transactionId: 7,
        result: expect.objectContaining({ status }),
      }),
    ]);
  }
);

test('a guarded request with a changed origin is stale before invoking any router', async () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state,
    affectedRouteKey: state.routes[0]?.key,
  }));
  const reducer = await renderReducer({ registry: new Map([['root', entry(reduce)]]) });
  await act(() =>
    reducer.result.current.processIntent({
      type: 'ACTION',
      payload: {
        action: { type: 'GO_BACK' },
        originKey: 'removed',
        transaction: { id: 9, token: {}, expectedState: { ...initialState, key: 'removed' } },
      },
      actionId: 9,
    })
  );
  expect(reduce).not.toHaveBeenCalled();
  expect(reducer.result.current.report?.events).toContainEqual(
    expect.objectContaining({
      type: 'action-result',
      transactionId: 9,
      result: expect.objectContaining({ status: 'stale' }),
    })
  );
});

test('cancellation before reduction rejects an otherwise identical navigation state', async () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: 1 },
    affectedRouteKey: state.routes[1]?.key,
  }));
  const registry = new Map([['root', entry(reduce)]]);
  const reducer = await renderReducer({ registry, cancelledTransactions: { has: () => false } });
  const expectedState = reducer.result.current.state;
  await act(async () => {
    // A scope/overlay invalidation does not necessarily change navigation state.
    await reducer.rerender({
      registry,
      routesWithRemovalPrevented: new Set(),
      cancelledTransactions: { has: () => true },
    });
    reducer.result.current.processIntent({
      type: 'ACTION',
      payload: {
        action: { type: 'NEXT' },
        originKey: 'root',
        transaction: { id: 12, token: {}, expectedState },
      },
      actionId: 12,
    });
  });
  expect(reduce).not.toHaveBeenCalled();
  expect(reducer.result.current.state).toBe(expectedState);
  expect(reducer.result.current.report?.events).toContainEqual(
    expect.objectContaining({
      type: 'action-result',
      transactionId: 12,
      result: expect.objectContaining({ status: 'cancelled' }),
    })
  );
});

test('a committed history change invalidates an older preview snapshot', async () => {
  const reducer = await renderReducer({
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: state.index + 1 },
          affectedRouteKey: state.routes[state.index + 1]?.key,
        })),
      ],
    ]),
  });
  const expectedState = reducer.result.current.state;
  await act(() =>
    reducer.result.current.processIntent({
      type: 'ACTION',
      payload: { action: { type: 'NEXT' } },
      actionId: 30,
    })
  );
  await act(() =>
    reducer.result.current.processIntent({
      type: 'ACTION',
      payload: {
        action: { type: 'NEXT' },
        originKey: 'root',
        transaction: { id: 31, token: {}, expectedState },
      },
      actionId: 31,
    })
  );
  expect(reducer.result.current.state.index).toBe(1);
  expect(reducer.result.current.report?.events).toContainEqual(
    expect.objectContaining({
      type: 'action-result',
      transactionId: 31,
      result: expect.objectContaining({ status: 'stale' }),
    })
  );
});

test('a transaction from a removed navigation container cannot mutate its replacement', async () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: 1 },
    affectedRouteKey: state.routes[1]?.key,
  }));
  const registry = new Map([['root', entry(reduce)]]);
  const oldScope = {};
  const reducer = await renderReducer({ registry, transactionScope: {} });
  const expectedState = reducer.result.current.state;
  await act(() =>
    reducer.result.current.processIntent({
      type: 'ACTION',
      actionId: 101,
      payload: {
        action: { type: 'NEXT' },
        transaction: { id: 101, token: {}, scope: oldScope, expectedState },
      },
    })
  );
  expect(reduce).not.toHaveBeenCalled();
  expect(reducer.result.current.state).toBe(expectedState);
  expect(reducer.result.current.report?.events).toContainEqual(
    expect.objectContaining({
      type: 'action-result',
      transactionId: 101,
      result: expect.objectContaining({ status: 'cancelled' }),
    })
  );
});
