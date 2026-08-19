import { act, renderHook } from '@testing-library/react-native';

import type { RouteNode } from '../../Route';
import type { NavigationAction, NavigationState } from '../../react-navigation/routers';
import type { RouterRegistry, RouterRegistryEntry } from '../routerRegistry';
import { useNavigationTreeReducer } from '../useNavigationTreeReducer';

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

function node(route: string, children: RouteNode[] = []): RouteNode {
  return {
    type: 'route',
    route,
    children,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({}),
  };
}

function createEntry(reduce: RouterRegistryEntry['reduce']): RouterRegistryEntry {
  return {
    reduce,
  };
}

function renderReducer({
  registry,
  onUnhandledAction = jest.fn(),
  onStateChangeInsertion = jest.fn(),
}: {
  registry: RouterRegistry;
  onUnhandledAction?: (action: NavigationAction) => void;
  onStateChangeInsertion?: (state: NavigationState) => void;
}) {
  return renderHook<ReturnType<typeof useNavigationTreeReducer>, { registry: RouterRegistry }>(
    ({ registry }) =>
      useNavigationTreeReducer({
        initialState,
        registry,
        onUnhandledAction,
        onStateChangeInsertion,
      }),
    { initialProps: { registry } }
  );
}

it('reduces consecutive actions against accumulated state with one committed update', () => {
  const reduce = jest.fn((state: NavigationState) => ({
    state: { ...state, index: state.index + 1 },
    affectedRouteKey: state.routes[state.index + 1]!.key,
  }));
  const onStateChangeInsertion = jest.fn();
  const result = renderReducer({
    registry: new Map([['root', createEntry(reduce)]]),
    onStateChangeInsertion,
  });

  act(() => {
    result.result.current.handleAction({ type: 'NEXT' });
    result.result.current.handleAction({ type: 'NEXT' });
  });

  expect(reduce).toHaveBeenCalledTimes(2);
  expect(reduce.mock.calls[1]![0].index).toBe(1);
  expect(result.result.current.state.index).toBe(2);
  expect(onStateChangeInsertion).toHaveBeenCalledTimes(2);
});

it('reports an action dispatched before its router registers', () => {
  const onUnhandledAction = jest.fn();
  const result = renderReducer({ registry: new Map(), onUnhandledAction });
  const action = { type: 'TEST' };

  act(() =>
    expect(result.result.current.handleAction(action)).toEqual({
      handled: false,
    })
  );

  expect(onUnhandledAction).toHaveBeenCalledWith(action);
});

it('reports a later action after a same-batch reset changes the registered state key', () => {
  const onUnhandledAction = jest.fn();
  const entry = createEntry((state, action) =>
    action.type === 'RESET_KEY'
      ? {
          state: { ...state, key: 'next-root' },
          affectedRouteKey: state.routes[0]!.key,
        }
      : null
  );
  const result = renderReducer({
    registry: new Map([['root', entry]]),
    onUnhandledAction,
  });

  act(() => {
    expect(result.result.current.handleAction({ type: 'RESET_KEY' }).handled).toBe(true);
    expect(result.result.current.handleAction({ type: 'NEXT' })).toEqual({
      handled: false,
    });
  });

  expect(onUnhandledAction).toHaveBeenCalledWith({ type: 'NEXT' });
  expect(result.result.current.state.key).toBe('next-root');
});

it('resets a state slice when its router unregisters', () => {
  const routeNode = node('root', [node('first'), node('second'), node('third')]);
  routeNode.initialRouteName = 'second';
  const entry = { ...createEntry(() => null), routeNode };
  const result = renderReducer({ registry: new Map([['root', entry]]) });

  result.rerender({ registry: new Map() });

  expect(result.result.current.state).toMatchObject({
    index: 0,
    routeNames: ['second', 'first', 'third'],
    routes: [{ name: 'second' }],
  });
});

it('does not reset a state slice when its router entry is replaced', () => {
  const result = renderReducer({
    registry: new Map([['root', createEntry(() => null)]]),
  });

  result.rerender({ registry: new Map([['root', createEntry(() => null)]]) });

  expect(result.result.current.state).toBe(initialState);
});
