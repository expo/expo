import { act, render, renderHook } from '@testing-library/react-native';
import * as React from 'react';

import {
  type NavigationState,
  type StackNavigationState,
  type ParamListBase,
  StackRouter,
} from '../../react-navigation/routers';
import type { RouterRegistry, RouterRegistryEntry } from '../routerRegistry';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';
import { entry } from './__fixtures__/routerEntry';

jest.mock('../getPathForState', () => ({
  getPathForState: (state: NavigationState) => `/${state.routes[state.index]!.name}`,
}));

const initialState: NavigationState = {
  stale: false,
  type: 'stack',
  key: 'root',
  routeKeySeq: 0,
  index: 0,
  routeNames: ['first', 'second', 'third'],
  routes: [{ key: 'first', name: 'first' }],
};

const registry: RouterRegistry = new Map([
  ['root', entry(StackRouter({}), ['first', 'second', 'third'])],
]);

function renderReducer() {
  return renderHook(() => useNavigationTreeReducer({ initialState, registry }));
}

function browserEvents(result: ReturnType<typeof renderReducer>) {
  return result.result.current.report?.events.filter((event) => event.type === 'browser-history');
}

test('seeds the report with a replace for the initial entry', () => {
  const result = renderReducer();

  expect(browserEvents(result)).toEqual([
    {
      id: 0,
      type: 'browser-history',
      op: 'replace',
      entryId: expect.stringMatching(/:0$/),
      path: '/first',
    },
  ]);
});

test('emits a push after an action that grows the stack', () => {
  const result = renderReducer();

  act(() =>
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'second' },
    })
  );

  expect(result.result.current.state.routes).toHaveLength(2);
  expect(browserEvents(result)?.at(-1)).toEqual({
    id: expect.any(Number),
    type: 'browser-history',
    op: 'push',
    entryId: expect.stringMatching(/:1$/),
    path: '/second',
  });
});

test('emits one push per action in a batch', () => {
  const result = renderReducer();

  act(() => {
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'second' },
    });
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'third' },
    });
  });

  expect(browserEvents(result)?.filter((event) => event.op === 'push')).toEqual([
    expect.objectContaining({ op: 'push', path: '/second' }),
    expect.objectContaining({ op: 'push', path: '/third' }),
  ]);
});

test('restores a tracked entry on a browser change without browser commands', () => {
  const result = renderReducer();
  const initialEntryId = browserEvents(result)![0]!;
  act(() =>
    result.result.current.handleAction({
      type: 'PUSH',
      payload: { name: 'second' },
    })
  );
  const eventsBefore = result.result.current.report!.events.length;

  act(() =>
    result.result.current.processIntent({
      type: 'BROWSER_HISTORY_CHANGED',
      payload: {
        id: initialEntryId.op === 'go' ? null : initialEntryId.entryId,
        path: '/first',
      },
    })
  );

  expect(result.result.current.state.routes).toEqual([{ key: 'first', name: 'first' }]);
  const newEvents = result.result.current.report!.events.slice(eventsBefore);
  expect(newEvents.map((event) => event.type)).toEqual(['removed-routes', 'action-dispatched']);
});

test('prunes consumed browser history events', () => {
  const result = renderReducer();

  act(() => result.result.current.consumeReportEvents([0]));

  expect(result.result.current.report).toBeUndefined();
});

test('lets the handling router push even when its history length is unchanged', () => {
  const customRegistry: RouterRegistry = new Map([
    [
      'root',
      entry((state) => ({
        state: { ...state, routes: [{ key: 'second', name: 'second' }] },
        affectedRouteKey: 'second',
        browserHistory: { type: 'push' },
      })),
    ],
  ]);
  const result = renderHook(() =>
    useNavigationTreeReducer({ initialState, registry: customRegistry })
  );
  act(() => result.result.current.handleAction({ type: 'CUSTOM' }));
  expect(browserEvents(result)?.at(-1)).toEqual(
    expect.objectContaining({ op: 'push', path: '/second' })
  );
});

test('defaults to replacing when a custom router grows its state without requesting a push', () => {
  const customRegistry: RouterRegistry = new Map([
    [
      'root',
      entry((state) => ({
        state: { ...state, index: 1, routes: [...state.routes, { key: 'second', name: 'second' }] },
        affectedRouteKey: 'second',
      })),
    ],
  ]);
  const result = renderHook(() =>
    useNavigationTreeReducer({ initialState, registry: customRegistry })
  );
  act(() => result.result.current.handleAction({ type: 'CUSTOM' }));
  expect(browserEvents(result)?.at(-1)).toEqual(
    expect.objectContaining({ op: 'replace', path: '/second' })
  );
});

test('replaces the browser entry for RESET even when the stack grows', () => {
  const result = renderReducer();
  act(() =>
    result.result.current.handleAction({
      type: 'RESET',
      payload: {
        ...initialState,
        index: 1,
        routes: [...initialState.routes, { key: 'second', name: 'second' }],
      },
    })
  );
  expect(browserEvents(result)?.at(-1)).toEqual(
    expect.objectContaining({ op: 'replace', path: '/second' })
  );
});

test('does not move browser history when a pop is prevented', () => {
  const state = {
    ...initialState,
    index: 1,
    routes: [...initialState.routes, { key: 'second', name: 'second' }],
  };
  const result = renderHook(() =>
    useNavigationTreeReducer({
      initialState: state,
      registry,
      routesWithRemovalPrevented: new Set(['second']),
    })
  );
  act(() => result.result.current.handleAction({ type: 'GO_BACK' }));
  expect(result.result.current.state).toBe(state);
  expect(browserEvents(result)).toHaveLength(1);
  expect(result.result.current.report?.events.at(-1)?.type).toBe('prevented-routes');
});

test('uses the parent stack decision when focusing a hidden child removes the visible route', () => {
  const child = { ...initialState, key: 'child' };
  const state = {
    ...initialState,
    index: 1,
    routes: [
      { key: 'first', name: 'first', state: child },
      { key: 'second', name: 'second' },
    ],
  };
  const parentRouter = StackRouter({});
  const childRouter = StackRouter({});
  const parentEntry = entry(parentRouter, initialState.routeNames);
  const childEntry = entry(childRouter, initialState.routeNames);
  const seed = { ...state, index: 0, routes: [state.routes[0]!] };
  const nestedRegistry: RouterRegistry = new Map<string, RouterRegistryEntry>([
    [
      'root',
      {
        ...parentEntry,
        getStateForRouteFocus: (state, key) =>
          parentRouter.getStateForRouteFocus(state as StackNavigationState<ParamListBase>, key),
      },
    ],
    ['child', { ...childEntry, shouldActionChangeFocus: childRouter.shouldActionChangeFocus }],
  ]);
  const result = renderHook(() =>
    useNavigationTreeReducer({ initialState: seed, registry: nestedRegistry })
  );
  act(() =>
    result.result.current.handleAction({
      type: 'PUSH',
      target: 'root',
      payload: { name: 'second' },
    })
  );
  act(() =>
    result.result.current.handleAction({
      type: 'NAVIGATE',
      target: 'child',
      payload: { name: 'first' },
    })
  );
  expect(result.result.current.state.index).toBe(0);
  expect(browserEvents(result)?.slice(-2)).toEqual([
    expect.objectContaining({ op: 'go', delta: -1 }),
    expect.objectContaining({ op: 'replace', path: '/first' }),
  ]);
});

test('browser restoration discards history commands from an uncommitted destination', () => {
  const commands: { id: number; op: string; entryId?: string; path?: string }[] = [];
  const seen = new Set<number>();
  const suspended = new Promise<void>(() => {});
  let processIntent: ReturnType<typeof useNavigationTreeReducer>['processIntent'];
  function Consumer() {
    const result = useNavigationTreeReducer({ initialState, registry });
    processIntent = result.processIntent;
    React.useLayoutEffect(() => {
      for (const event of result.report?.events ?? []) {
        if (event.type === 'browser-history' && !seen.has(event.id)) {
          seen.add(event.id);
          commands.push(event);
        }
      }
    }, [result.report]);
    if (result.state.routes[result.state.index]!.name === 'second') throw suspended;
    return null;
  }
  render(
    <React.Suspense fallback={null}>
      <Consumer />
    </React.Suspense>
  );
  const firstEntryId = commands[0]!.entryId!;
  act(() =>
    React.startTransition(() =>
      processIntent({
        type: 'ACTION',
        payload: { action: { type: 'PUSH', payload: { name: 'second' } } },
      })
    )
  );
  expect(commands).toHaveLength(1);
  act(() =>
    React.startTransition(() =>
      processIntent({
        type: 'BROWSER_HISTORY_CHANGED',
        payload: { id: firstEntryId, path: '/first' },
      })
    )
  );
  expect(commands).toHaveLength(1);
});
