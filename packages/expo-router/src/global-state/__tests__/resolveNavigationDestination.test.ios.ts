import type { RouteNode } from '../../Route';
import {
  TabRouter,
  StackRouter,
  type NavigationAction,
  type NavigationState,
  type RouterActionResult,
} from '../../react-navigation/routers';
import { resolveNavigationDestination } from '../resolveNavigationDestination';
import type { RouterRegistry, RouterRegistryEntry } from '../routerRegistry';

jest.mock('nanoid/non-secure', () => {
  let id = 0;
  return { nanoid: () => `test-${++id}` };
});

function node(route: string, children: RouteNode[] = [], initialRouteName?: string): RouteNode {
  return {
    type: 'route',
    route,
    children,
    initialRouteName,
    dynamic: null,
    contextKey: route,
    loadRoute: () => ({}),
  };
}

function entry(
  router: ReturnType<typeof TabRouter> | ReturnType<typeof StackRouter>,
  routeNames: string[]
): RouterRegistryEntry {
  return {
    routerType: router.type,
    reduce: (state: NavigationState, action: NavigationAction) => {
      // The registry erases each router's narrower state and action unions at this boundary.
      const reduce = router.getStateForAction as (
        state: NavigationState,
        action: NavigationAction,
        options: {
          routeNames: string[];
          routeGetIdList: Record<string, undefined>;
        }
      ) => RouterActionResult<NavigationState> | null;
      return reduce(state, action, { routeNames, routeGetIdList: {} });
    },
  };
}

test('switches mounted tabs and extends the selected tab stack', () => {
  const settingsStack: NavigationState = {
    stale: false,
    type: 'stack',
    key: 'settings-stack',
    index: 1,
    routeNames: ['index', 'existing', 'details'],
    routes: [
      { key: 'index-key', name: 'index' },
      { key: 'existing-key', name: 'existing' },
    ],
  };
  const tabs: NavigationState = {
    stale: false,
    type: 'tab',
    key: 'tabs',
    index: 0,
    routeNames: ['home', 'settings'],
    routes: [
      { key: 'home-key', name: 'home' },
      { key: 'settings-key', name: 'settings', state: settingsStack },
    ],
  };
  const routeNode = node('tabs', [
    node('home'),
    node('settings', [node('index'), node('existing'), node('details')]),
  ]);
  const registry: RouterRegistry = new Map([
    ['tabs', entry(TabRouter({}), tabs.routeNames)],
    ['settings-stack', entry(StackRouter({}), settingsStack.routeNames)],
  ]);
  const targetState = {
    routes: [
      {
        name: 'settings',
        state: { routes: [{ name: 'details', params: { id: 'new' } }] },
      },
    ],
  };

  const action = resolveNavigationDestination({
    targetState,
    navigationState: tabs,
    routeNode,
    registry,
    action: { type: 'JUMP_TO', payload: {} },
  });

  expect(action.type).toBe('JUMP_TO');
  expect(action.target).toBe('tabs');
  expect(action.payload.name).toBe('settings');
  expect(action.payload.state?.__internal__routerActionState).toBe(true);
  expect(action.payload.state?.routes.map((route) => route.name)).toEqual([
    'index',
    'existing',
    'details',
  ]);
  expect(settingsStack.routes).toHaveLength(2);
});

test.each([
  [false, ['details']],
  [true, ['index', 'details']],
])('builds an unmounted destination with anchor=%s', (withAnchor, expectedRoutes) => {
  const tabs: NavigationState = {
    stale: false,
    type: 'tab',
    key: 'tabs',
    index: 0,
    routeNames: ['home', 'settings'],
    routes: [
      { key: 'home-key', name: 'home' },
      { key: 'settings-key', name: 'settings' },
    ],
  };
  const routeNode = node('tabs', [
    node('home'),
    node('settings', [node('index'), node('details')], 'index'),
  ]);
  const registry: RouterRegistry = new Map([['tabs', entry(TabRouter({}), tabs.routeNames)]]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'details' }] } }],
    },
    navigationState: tabs,
    routeNode,
    registry,
    action: { type: 'JUMP_TO', payload: {} },
    withAnchor,
  });

  expect(action.payload.state?.stale).toBe(false);
  expect(action.payload.state?.key).toBeDefined();
  expect(action.payload.state?.routes.map((route) => route.name)).toEqual(expectedRoutes);
  expect(action.payload.state?.index).toBe(expectedRoutes.length - 1);
});

test('preloads a parent without focusing it and resolves its child', () => {
  const stack: NavigationState = {
    stale: false,
    type: 'stack',
    key: 'root-stack',
    index: 0,
    routeNames: ['home', 'settings'],
    routes: [{ key: 'home-key', name: 'home' }],
  };
  const routeNode = node('root', [
    node('home'),
    node('settings', [node('index'), node('details')]),
  ]);
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), stack.routeNames)],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'details' }] } }],
    },
    navigationState: stack,
    routeNode,
    registry,
    action: { type: 'PRELOAD', payload: {} },
  });
  const result = registry.get('root-stack')!.reduce(stack, action)!;

  expect(result.state.index).toBe(0);
  expect(result.affectedRouteKey).not.toBe('home-key');
  expect(
    result.state.routes.find((route) => route.key === result.affectedRouteKey)?.state?.routes[0]
      ?.name
  ).toBe('details');
});

test('preloads into the mounted stack of an unfocused tab', () => {
  const settingsStack: NavigationState = {
    stale: false,
    type: 'stack',
    key: 'settings-stack',
    index: 0,
    routeNames: ['index', 'details'],
    routes: [{ key: 'index-key', name: 'index' }],
  };
  const tabs: NavigationState = {
    stale: false,
    type: 'tab',
    key: 'tabs',
    index: 0,
    routeNames: ['home', 'settings'],
    routes: [
      { key: 'home-key', name: 'home' },
      { key: 'settings-key', name: 'settings', state: settingsStack },
    ],
  };
  const routeNode = node('tabs', [
    node('home'),
    node('settings', [node('index'), node('details')]),
  ]);
  const registry: RouterRegistry = new Map([
    ['tabs', entry(TabRouter({}), tabs.routeNames)],
    ['settings-stack', entry(StackRouter({}), settingsStack.routeNames)],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'details' }] } }],
    },
    navigationState: tabs,
    routeNode,
    registry,
    action: { type: 'PRELOAD', payload: {} },
  });

  expect(action.target).toBe('settings-stack');
  expect(action.payload.name).toBe('details');
  expect(action.payload.state).toBeUndefined();
});

test('builds the synthetic root subtree without registered routers', () => {
  const rootState: NavigationState = {
    stale: false,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['__root'],
    routes: [{ key: 'root-route', name: '__root' }],
  };

  const action = resolveNavigationDestination({
    targetState: {
      routes: [
        {
          name: '__root',
          state: { routes: [{ name: 'details', params: { id: 'one' } }] },
        },
      ],
    },
    navigationState: rootState,
    routeNode: node('root', [node('details')]),
    registry: new Map(),
    action: { type: 'NAVIGATE', payload: {} },
  });

  expect(action.payload.name).toBe('__root');
  expect(action.payload.state?.routes[0]).toEqual(
    expect.objectContaining({ name: 'details', params: { id: 'one' } })
  );
});

test('rebuilds from a router that returns partial state', () => {
  const child: NavigationState = {
    stale: false,
    key: 'child-stack',
    index: 0,
    routeNames: ['index', 'details'],
    routes: [{ key: 'index-key', name: 'index' }],
  };
  const root: NavigationState = {
    stale: false,
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings-key', name: 'settings', state: child }],
  };
  const partialReducer = jest.fn(() => ({
    state: { routes: [{ name: 'details' }] },
    affectedRouteKey: undefined,
  }));
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), root.routeNames)],
    ['child-stack', { routerType: 'stack', reduce: partialReducer }],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'details' }] } }],
    },
    navigationState: root,
    routeNode: node('root', [node('settings', [node('index'), node('details')])]),
    registry,
    action: { type: 'NAVIGATE', payload: {} },
  });

  expect(partialReducer).toHaveBeenCalled();
  expect(action.payload.state).toEqual(
    expect.objectContaining({
      stale: false,
      key: expect.any(String),
      routeNames: ['index', 'details'],
    })
  );
  expect(action.payload.state?.routes[0]).toEqual(
    expect.objectContaining({ name: 'details', key: expect.any(String) })
  );
});

test('strips source, target and first-level options from deeper actions', () => {
  const child: NavigationState = {
    stale: false,
    key: 'child-stack',
    index: 0,
    routeNames: ['details'],
    routes: [{ key: 'details-key', name: 'details' }],
  };
  const root: NavigationState = {
    stale: false,
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings-key', name: 'settings', state: child }],
  };
  const childActions: NavigationAction[] = [];
  const childRouter = StackRouter({});
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), root.routeNames)],
    [
      'child-stack',
      {
        routerType: 'stack',
        reduce(state, action) {
          childActions.push(action);
          return entry(childRouter, child.routeNames).reduce(state, action);
        },
      },
    ],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'details' }] } }],
    },
    navigationState: root,
    routeNode: node('root', [node('settings', [node('details')])]),
    registry,
    action: {
      type: 'REPLACE',
      source: 'source-key',
      target: 'old-target',
      payload: { merge: true, singular: true },
    },
  });

  expect(action.type).toBe('REPLACE');
  expect(action.source).toBeUndefined();
  expect(action.target).toBe('child-stack');
  expect(childActions).not.toHaveLength(0);
  expect(childActions[0]).toEqual({
    type: 'NAVIGATE',
    payload: { name: 'details', params: undefined },
  });
});

test('targets an equivalent mounted state directly without carrying replacement state', () => {
  const child: NavigationState = {
    stale: false,
    key: 'child-stack',
    index: 0,
    routeNames: ['details'],
    routes: [{ key: 'details-key', name: 'details' }],
  };
  const root: NavigationState = {
    stale: false,
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings-key', name: 'settings', state: child }],
  };
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), root.routeNames)],
    ['child-stack', entry(StackRouter({}), child.routeNames)],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'details' }] } }],
    },
    navigationState: root,
    routeNode: node('root', [node('settings', [node('details')])]),
    registry,
    action: { type: 'NAVIGATE', payload: {} },
  });

  expect(action.target).toBe('child-stack');
  expect(action.payload.state).toBeUndefined();
  expect(root.routes[0]?.state).toBe(child);
});

test('adds internal params at every generated level without mutating inputs', () => {
  const stack: NavigationState = {
    stale: false,
    type: 'stack',
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings-key', name: 'settings' }],
  };
  Object.freeze(stack.routes);
  Object.freeze(stack);
  const routeNode = node('root', [node('settings', [node('details')])]);
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), stack.routeNames)],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [
        {
          name: 'settings',
          params: { user: 'value' },
          state: { routes: [{ name: 'details', params: { child: 'value' } }] },
        },
      ],
    },
    navigationState: stack,
    routeNode,
    registry,
    action: { type: 'NAVIGATE', source: 'source', payload: {} },
    internalParams: { __internal_expo_router_no_animation: true },
  });

  expect(action.source).toBe('source');
  expect(action.payload.params).toEqual(
    expect.objectContaining({
      user: 'value',
      __internal_expo_router_no_animation: true,
    })
  );
  expect(action.payload.state?.routes[0]?.params).toEqual(
    expect.objectContaining({
      child: 'value',
      __internal_expo_router_no_animation: true,
    })
  );
  expect(stack.routes[0]?.state).toBeUndefined();
});
