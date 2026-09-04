import { act, renderHook } from '@testing-library/react-native';

import type { NavigationAction, NavigationState } from '../../react-navigation/routers';
import { getNavigateAction } from '../getNavigationAction';
import type { RouterRegistry, RouterRegistryStore } from '../routerRegistry';
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

// Tests pass a plain map; the hook takes the read handle the provider puts in context.
function createTestStore(registry: RouterRegistry) {
  let snapshot = registry;
  return {
    store: { getSnapshot: () => snapshot, subscribe: () => () => {} } satisfies RouterRegistryStore,
    setRegistry(next: RouterRegistry) {
      snapshot = next;
    },
  };
}

function renderReducer({
  state = initialState,
  registry,
  routesWithRemovalPrevented = new Set(),
}: {
  state?: NavigationState;
  registry: RouterRegistry;
  routesWithRemovalPrevented?: ReadonlySet<string>;
}) {
  const { store, setRegistry } = createTestStore(registry);
  const reports: NonNullable<ReturnType<typeof useNavigationTreeReducer>['report']>[] = [];
  const result = renderHook<
    ReturnType<typeof useNavigationTreeReducer>,
    {
      registry: RouterRegistryStore;
      routesWithRemovalPrevented: ReadonlySet<string>;
    }
  >(
    ({ registry, routesWithRemovalPrevented }) => {
      const reducer = useNavigationTreeReducer({
        initialState: state,
        registry,
        routesWithRemovalPrevented,
      });
      if (reducer.report) {
        reports.push(reducer.report);
      }
      return reducer;
    },
    { initialProps: { registry: store, routesWithRemovalPrevented } }
  );
  return { ...result, reports, setRegistry };
}

test('reports and vetoes removal of a prevented route', () => {
  const action = { type: 'REMOVE' };
  const result = renderReducer({
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

  act(() => result.result.current.handleAction(action));

  expect(result.result.current.state).toBe(initialState);
  expect(result.reports.at(-1)).toMatchObject({
    events: [{ type: 'prevented-routes', routeKeys: ['third'], action }],
  });
  expect(result.result.current.report).toMatchObject({
    events: [{ type: 'prevented-routes', routeKeys: ['third'], action }],
  });
});

test('commits removal and reports removed routes when none are prevented', () => {
  const action = { type: 'REMOVE' };
  const result = renderReducer({
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

  act(() => result.result.current.handleAction(action));

  expect(result.result.current.state.routes).toHaveLength(1);
  expect(result.reports.at(-1)).toMatchObject({
    events: [
      { type: 'removed-routes', routeKeys: ['third', 'second'], action },
      { type: 'action-dispatched', action },
    ],
  });
});

test('does not let a preloaded stack route prevent removal', () => {
  const stackState: NavigationState = {
    ...initialState,
    type: 'stack',
    index: 0,
  };
  const result = renderReducer({
    state: stackState,
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

  act(() => result.result.current.handleAction({ type: 'REMOVE_PRELOAD' }));

  expect(result.result.current.state.routes).toHaveLength(1);
  expect(result.reports.at(-1)?.events).toEqual([
    expect.objectContaining({
      type: 'action-dispatched',
      action: { type: 'REMOVE_PRELOAD' },
    }),
  ]);
});

test('prevents moving an active route into the preloaded region', () => {
  const stackState: NavigationState = {
    ...initialState,
    type: 'stack',
    index: 2,
  };
  const result = renderReducer({
    state: stackState,
    registry: new Map([
      [
        'root',
        entry((state) => ({
          state: { ...state, index: 0 },
          affectedRouteKey: state.routes[0]!.key,
        })),
      ],
    ]),
    routesWithRemovalPrevented: new Set(['second']),
  });

  act(() => result.result.current.handleAction({ type: 'RESET_INDEX' }));

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

test('does not veto route name changes', () => {
  const action = { type: 'ROUTE_NAMES_CHANGED' };
  const result = renderReducer({
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

  act(() => result.result.current.handleAction(action));

  expect(result.result.current.state.routes).toHaveLength(1);
  expect(result.reports.at(-1)?.events).toEqual([
    { id: 0, type: 'removed-routes', routeKeys: ['third', 'second'], action },
    expect.objectContaining({ id: 1, type: 'action-dispatched', action }),
  ]);
});

it('reduces consecutive actions against accumulated state with one committed update', () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: state.index + 1 },
    affectedRouteKey: state.routes[state.index + 1]!.key,
  }));
  const result = renderReducer({
    registry: new Map([['root', entry(reduce)]]),
  });

  const firstAction = { type: 'NEXT_FIRST' };
  const secondAction = { type: 'NEXT_SECOND' };
  act(() => {
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

it('reduces against the snapshot taken at dispatch', () => {
  const reduceAtDispatch = jest.fn((state: NavigationState) => ({
    state,
    affectedRouteKey: state.routes[state.index]!.key,
  }));
  const reduceAfterDispatch = jest.fn((state: NavigationState) => ({
    state,
    affectedRouteKey: state.routes[state.index]!.key,
  }));
  const result = renderReducer({ registry: new Map([['root', entry(reduceAtDispatch)]]) });

  act(() => {
    result.result.current.handleAction({ type: 'NEXT' });
    // A navigator registers before React processes the queued action, swapping in a new snapshot.
    result.setRegistry(new Map([['root', entry(reduceAfterDispatch)]]));
  });

  expect(reduceAtDispatch).toHaveBeenCalledTimes(1);
  expect(reduceAfterDispatch).not.toHaveBeenCalled();
});

it('assigns increasing ids to events across actions', () => {
  const result = renderReducer({
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

  act(() => result.result.current.handleAction({ type: 'FIRST' }));
  act(() => result.result.current.handleAction({ type: 'SECOND' }));

  expect(result.result.current.report?.events.map((event) => event.id)).toEqual([0, 1]);
});

it('consumes only the listed report events', () => {
  const result = renderReducer({
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

  act(() => {
    result.result.current.handleAction({ type: 'FIRST' });
    result.result.current.handleAction({ type: 'SECOND' });
  });
  act(() => result.result.current.consumeReportEvents([0]));

  expect(result.result.current.report?.events.map((event) => event.id)).toEqual([1]);

  const report = result.result.current.report;
  act(() => result.result.current.consumeReportEvents([99]));
  expect(result.result.current.report).toBe(report);

  act(() => result.result.current.consumeReportEvents([1]));
  expect(result.result.current.report).toBeUndefined();
});

it('logs an error for stale focused state after commit', () => {
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
  const result = renderReducer({
    registry: new Map([['root', entry(reduce)]]),
  });

  act(() => result.result.current.handleAction({ type: 'STALE' }));

  expect(error).toHaveBeenCalledWith('Detected stale state. This is likely a bug in Expo Router.');
  process.env.NODE_ENV = nodeEnv;
  error.mockRestore();
});

it('logs an error for focused state without an index after commit', () => {
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
  const result = renderReducer({ registry: new Map([['root', entry(reduce)]]) });

  act(() => result.result.current.handleAction({ type: 'INCOMPLETE' }));

  expect(error).toHaveBeenCalledWith('Detected stale state. This is likely a bug in Expo Router.');
  process.env.NODE_ENV = nodeEnv;
  error.mockRestore();
});

it('reduces consecutive queued intents against accumulated state', () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: state.index + 1 },
    affectedRouteKey: state.routes[state.index + 1]!.key,
  }));
  const result = renderReducer({
    registry: new Map([['root', entry(reduce)]]),
  });

  act(() => {
    result.result.current.processIntent({
      type: 'ACTION',
      payload: { action: { type: 'NEXT' } },
    });
    result.result.current.processIntent({
      type: 'ACTION',
      payload: { action: { type: 'NEXT' } },
    });
  });

  expect(reduce).toHaveBeenCalledTimes(2);
  expect(reduce.mock.calls[1]![0].index).toBe(1);
  expect(result.result.current.state.index).toBe(2);
});

it('warns for direct navigation actions carrying a screen param', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const result = renderReducer({
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

  act(() => {
    result.result.current.handleAction({
      type: 'NAVIGATE',
      payload: { name: 'first', params: { screen: 'nested' } },
    });
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('`screen` param'));
  warn.mockRestore();
});

it('logs an error when an action is dispatched before its router registers', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const result = renderReducer({ registry: new Map() });

  act(() => result.result.current.handleAction({ type: 'TEST' }));

  expect(error).toHaveBeenCalledWith(expect.stringContaining("The action 'TEST'"));
  expect(result.result.current.state).toBe(initialState);
  error.mockRestore();
});

it('logs an error for a later action after a same-batch reset changes the registered state key', () => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  const registryEntry = entry((state, action) =>
    action.type === 'RESET_KEY'
      ? {
          state: { ...state, key: 'next-root' },
          affectedRouteKey: state.routes[0]!.key,
        }
      : null
  );
  const result = renderReducer({
    registry: new Map([['root', registryEntry]]),
  });

  act(() => {
    result.result.current.handleAction({ type: 'RESET_KEY' });
    result.result.current.handleAction({ type: 'NEXT' });
  });

  expect(error).toHaveBeenCalledWith(expect.stringContaining("The action 'NEXT'"));
  expect(result.result.current.state.key).toBe('next-root');
  error.mockRestore();
});

it('resets a state slice when its router unregisters', () => {
  const routeNode = node('root', [node('first'), node('second'), node('third')]);
  routeNode.initialRouteName = 'second';
  const registryEntry = { ...entry(() => null), routeNode };
  const result = renderReducer({
    registry: new Map([['root', registryEntry]]),
  });

  act(() => result.result.current.onRegistryChange('root', registryEntry, true));

  act(() => result.result.current.onRegistryChange('root', registryEntry, false));

  expect(result.result.current.state).toMatchObject({
    index: 0,
    routeNames: ['second', 'first', 'third'],
    routes: [{ name: 'second' }],
  });
});

it('resets a state slice when its router type changes', () => {
  const result = renderReducer({ registry: new Map() });

  act(() => result.result.current.resetNavigator('root', 'tab'));

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

it('ignores a router type change for an unknown state key', () => {
  const result = renderReducer({ registry: new Map() });

  act(() => result.result.current.resetNavigator('missing', 'tab'));

  expect(result.result.current.state).toBe(initialState);
});

it('does not reset a state slice when its router entry is replaced', () => {
  const routeNode = node('root', [node('first'), node('second'), node('third')]);
  routeNode.initialRouteName = 'second';
  const registryEntry = { ...entry(() => null), routeNode };
  const nextEntry = { ...entry(() => null), routeNode };
  const result = renderReducer({
    registry: new Map([['root', registryEntry]]),
  });
  act(() => result.result.current.onRegistryChange('root', registryEntry, true));

  act(() => {
    result.result.current.onRegistryChange('root', registryEntry, false);
    result.result.current.onRegistryChange('root', nextEntry, true);
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

  function navigateToHref(
    result: ReturnType<typeof renderReducer>,
    payload: {
      href?: string;
      options?: LinkToOptions;
      originalHref?: string;
    } = {}
  ) {
    act(() =>
      result.result.current.processIntent({
        type: 'NAVIGATE_TO_HREF',
        payload: { href: '/second', options: {}, ...payload },
      })
    );
  }

  it('warns and keeps the state when resolving the href throws', () => {
    mockGetNavigateAction.mockImplementation(() => {
      throw new Error('boom');
    });
    const result = renderReducer({ registry: new Map() });

    navigateToHref(result);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('boom'));
    expect(result.result.current.state).toBe(initialState);
  });

  it('warns with the resolved href when the href is invalid', () => {
    mockGetNavigateAction.mockReturnValue({
      status: 'invalid',
      href: '/resolved',
    });
    const result = renderReducer({ registry: new Map() });

    navigateToHref(result);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('/resolved'));
    expect(result.result.current.state).toBe(initialState);
  });

  it('warns with the original href when the href is invalid after a redirect', () => {
    mockGetNavigateAction.mockReturnValue({
      status: 'invalid',
      href: '/resolved',
    });
    const result = renderReducer({ registry: new Map() });

    navigateToHref(result, { originalHref: 'myapp://original' });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('myapp://original'));
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('/resolved'));
    expect(result.result.current.state).toBe(initialState);
  });

  it('reduces the resolved action against the current state', () => {
    const action = { type: 'NEXT' };
    const dangerouslySingular = () => 'singular';
    mockGetNavigateAction.mockReturnValue({ status: 'action', action });
    const reduce = jest.fn((state: NavigationState, _action: NavigationAction) => ({
      state: { ...state, index: state.index + 1 },
      affectedRouteKey: state.routes[state.index + 1]!.key,
    }));
    const registry: RouterRegistry = new Map([['root', entry(reduce)]]);
    const result = renderReducer({ registry });

    navigateToHref(result, {
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
      },
      'PUSH',
      true,
      dangerouslySingular,
      true,
      initialState
    );
  });
});

it('throws for an incomplete initial state', () => {
  expect(() =>
    renderHook(() =>
      useNavigationTreeReducer({
        initialState: { routes: [{ name: 'first' }] },
        registry: { getSnapshot: () => new Map(), subscribe: () => () => {} },
      })
    )
  ).toThrow('incomplete initial state');
});
