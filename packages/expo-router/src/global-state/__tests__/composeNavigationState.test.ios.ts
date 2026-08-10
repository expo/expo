import type { ResultState } from '../../fork/getStateFromPath';
import type { NavigationState } from '../../react-navigation/native';
import {
  composeNavigationState,
  DEFER_NAVIGATION,
  getNavigationActionType,
} from '../composeNavigationState';
import type { RouterRegistry } from '../routerRegistry';

function state(
  key: string,
  routes: NavigationState['routes'],
  type = 'stack',
  index = routes.length - 1
): NavigationState {
  return {
    stale: false,
    type,
    key,
    index,
    routeNames: routes.map((route) => route.name),
    routes,
  };
}

function actionState(name: string, child?: ResultState): ResultState {
  return {
    routes: [{ name, state: child }],
  };
}

describe(composeNavigationState, () => {
  it.each([
    ['PUSH', 'stack', 'PUSH'],
    ['PUSH', 'tab', 'PUSH'],
    ['PUSH', 'expo-tab', 'JUMP_TO'],
    ['POP_TO', 'tab', 'NAVIGATE'],
    ['NAVIGATE', 'expo-tab', 'JUMP_TO'],
    ['REPLACE', 'expo-tab', 'REPLACE'],
    ['PRELOAD', 'expo-tab', 'PRELOAD'],
  ])('maps %s for %s routers to %s', (actionType, routerType, expected) => {
    expect(getNavigationActionType(actionType, routerType)).toBe(expected);
  });

  it('reduces each mounted navigator and preserves child history', () => {
    const child = state('child-state', [
      { key: 'first-key', name: 'first' },
      { key: 'second-key', name: 'second' },
    ]);
    const root = state('root-state', [{ key: 'parent-key', name: 'parent', state: child }]);
    const rootReduce = jest.fn((current: NavigationState) => current);
    const childReduce = jest.fn((current: NavigationState) => ({
      ...current,
      index: 2,
      routes: [...current.routes, { key: 'third-key', name: 'third', params: { value: '3' } }],
    }));
    const registry: RouterRegistry = new Map([
      ['root-state', { routerType: 'stack', reduce: rootReduce }],
      ['child-state', { routerType: 'stack', reduce: childReduce }],
    ]);

    const result = composeNavigationState({
      navigationState: root,
      actionState: actionState('parent', actionState('third')),
      actionType: 'PUSH',
      registry,
      singular: true,
    });

    expect(result).not.toBe(DEFER_NAVIGATION);
    expect(rootReduce).toHaveBeenCalledWith(
      root,
      expect.objectContaining({
        type: 'PUSH',
        target: 'root-state',
        payload: { name: 'parent', params: {}, singular: true },
      })
    );
    expect(childReduce).toHaveBeenCalledWith(
      child,
      expect.objectContaining({
        type: 'PUSH',
        target: 'child-state',
        payload: { name: 'third', params: {}, singular: undefined },
      })
    );
    expect((result as NavigationState).routes[0]!.state).toEqual(
      expect.objectContaining({
        routes: [
          { key: 'first-key', name: 'first' },
          { key: 'second-key', name: 'second' },
          { key: 'third-key', name: 'third', params: { value: '3' } },
        ],
      })
    );
  });

  it('attaches a partial tail to a new route without nested transport params', () => {
    const root = state('root-state', [{ key: 'index-key', name: 'index' }]);
    const registry: RouterRegistry = new Map([
      [
        'root-state',
        {
          routerType: 'stack',
          reduce: () =>
            state('root-state', [
              { key: 'index-key', name: 'index' },
              { key: 'parent-key', name: 'parent', params: { id: '1' } },
            ]),
        },
      ],
    ]);

    const result = composeNavigationState({
      navigationState: root,
      actionState: {
        routes: [
          {
            name: 'parent',
            params: { id: '1' },
            state: actionState('leaf'),
          },
        ],
      },
      actionType: 'PUSH',
      registry,
    });

    expect(result).toEqual(
      expect.objectContaining({
        routes: [
          { key: 'index-key', name: 'index' },
          {
            key: 'parent-key',
            name: 'parent',
            params: { id: '1' },
            state: { index: 0, routes: [{ name: 'leaf' }] },
          },
        ],
      })
    );
  });

  it('attaches internal params to an unmounted tail', () => {
    const root = state('root-state', [{ key: 'index-key', name: 'index' }]);
    const registry: RouterRegistry = new Map([
      [
        'root-state',
        {
          routerType: 'stack',
          reduce: () => state('root-state', [{ key: 'parent-key', name: 'parent' }]),
        },
      ],
    ]);

    const result = composeNavigationState({
      navigationState: root,
      actionState: actionState('parent', actionState('leaf')),
      actionType: 'PRELOAD',
      registry,
      internalParams: { __internal__expo_router_is_preview_navigation: true },
    }) as NavigationState;

    expect(result.routes[0]!.state).toEqual({
      index: 0,
      routes: [
        {
          name: 'leaf',
          params: { __internal__expo_router_is_preview_navigation: true },
        },
      ],
    });
  });

  it('preserves parsed anchor routes only when requested', () => {
    const root = state('root-state', [{ key: 'index-key', name: 'index' }]);
    const registry: RouterRegistry = new Map([
      [
        'root-state',
        {
          routerType: 'stack',
          reduce: () => state('root-state', [{ key: 'parent-key', name: 'parent' }]),
        },
      ],
    ]);
    const tail: ResultState = {
      index: 1,
      routes: [{ name: 'anchor' }, { name: 'leaf' }],
    };

    const withoutAnchor = composeNavigationState({
      navigationState: root,
      actionState: actionState('parent', tail),
      actionType: 'NAVIGATE',
      registry,
    }) as NavigationState;
    const withAnchor = composeNavigationState({
      navigationState: root,
      actionState: actionState('parent', tail),
      actionType: 'NAVIGATE',
      registry,
      withAnchor: true,
    }) as NavigationState;

    expect(withoutAnchor.routes[0]!.state).toEqual({
      index: 0,
      routes: [{ name: 'leaf' }],
    });
    expect(withAnchor.routes[0]!.state).toBe(tail);
  });

  it('defers when an existing child state has no registered reducer', () => {
    const child = state('child-state', [{ key: 'leaf-key', name: 'leaf' }]);
    const root = state('root-state', [{ key: 'parent-key', name: 'parent', state: child }]);
    const registry: RouterRegistry = new Map([
      ['root-state', { routerType: 'stack', reduce: (current) => current }],
    ]);

    expect(
      composeNavigationState({
        navigationState: root,
        actionState: actionState('parent', actionState('next')),
        actionType: 'NAVIGATE',
        registry,
      })
    ).toBe(DEFER_NAVIGATION);
  });

  it('replaces an existing partial child state without deferring', () => {
    const partialChild: ResultState = { routes: [{ name: 'current' }] };
    const root = state('root-state', [{ key: 'parent-key', name: 'parent', state: partialChild }]);
    const registry: RouterRegistry = new Map([
      ['root-state', { routerType: 'stack', reduce: (current) => current }],
    ]);

    const result = composeNavigationState({
      navigationState: root,
      actionState: actionState('parent', actionState('next')),
      actionType: 'NAVIGATE',
      registry,
    }) as NavigationState;

    expect(result.routes[0]!.state).toEqual({ index: 0, routes: [{ name: 'next' }] });
  });

  it('returns null and warns when a reducer rejects the action', () => {
    const root = state('root-state', [{ key: 'index-key', name: 'index' }]);
    const registry: RouterRegistry = new Map([
      ['root-state', { routerType: 'stack', reduce: () => null }],
    ]);
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(
      composeNavigationState({
        navigationState: root,
        actionState: actionState('missing'),
        actionType: 'NAVIGATE',
        registry,
      })
    ).toBeNull();
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("route 'missing'"));

    warning.mockRestore();
  });
});
