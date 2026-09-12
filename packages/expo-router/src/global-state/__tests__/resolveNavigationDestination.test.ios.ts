import {
  TabRouter,
  StackRouter,
  type NavigationAction,
  type NavigationState,
} from '../../react-navigation/routers';
import { resolveNavigationDestination } from '../resolveNavigationDestination';
import type { RouterRegistry } from '../routerRegistry';
import { node } from './__fixtures__/routeNode';
import { entry } from './__fixtures__/routerEntry';

const tabs: NavigationState = {
  stale: false,
  routeKeySeq: 0,
  type: 'tab',
  key: 'tabs',
  index: 0,
  routeNames: ['home', 'settings'],
  routes: [
    { key: 'home-key', name: 'home' },
    { key: 'settings:0', name: 'settings' },
  ],
};

test('switches mounted tabs and extends the selected tab stack', () => {
  const settingsStack: NavigationState = {
    stale: false,
    routeKeySeq: 0,
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
    routeKeySeq: 0,
    type: 'tab',
    key: 'tabs',
    index: 0,
    routeNames: ['home', 'settings'],
    routes: [
      { key: 'home-key', name: 'home' },
      { key: 'settings:0', name: 'settings', state: settingsStack },
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

test('orders unmounted destination routeNames like a mounted navigator', () => {
  // The anchor is declared after `orange` in the file tree, so the raw child order differs
  // from the order a mounted navigator reports via `useSortedScreens`.
  const routeNode = node('tabs', [
    node('home'),
    node('settings', [node('orange'), node('test')], 'test'),
  ]);
  const registry: RouterRegistry = new Map([['tabs', entry(TabRouter({}), tabs.routeNames)]]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'orange' }] } }],
    },
    navigationState: tabs,
    routeNode,
    registry,
    action: { type: 'JUMP_TO', payload: {} },
  });

  expect(action.payload.state?.routeNames).toEqual(['test', 'orange']);
});

test('warns and falls back to the initial route for an unknown destination', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const routeNode = node('tabs', [
    node('home'),
    node('settings', [node('index'), node('details')], 'index'),
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: 'settings', state: { routes: [{ name: 'missing' }] } }],
    },
    navigationState: tabs,
    routeNode,
    registry: new Map([['tabs', entry(TabRouter({}), tabs.routeNames)]]),
    action: { type: 'JUMP_TO', payload: {} },
  });

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown route "missing"'));
  expect(action.payload.state?.routes.map((route) => route.name)).toEqual(['index']);
  warn.mockRestore();
});

test('builds nested state from a same-name child route node', () => {
  const innerFoo = node('foo', [node('bar')]);
  const outerFoo = node('foo', [innerFoo]);
  const outerState: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    type: 'stack',
    key: 'outer-foo',
    index: 0,
    routeNames: ['foo'],
    routes: [{ key: 'inner-foo:0', name: 'foo' }],
  };
  const rootState: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    type: 'stack',
    key: 'root',
    index: 0,
    routeNames: ['foo'],
    routes: [{ key: 'outer-foo:0', name: 'foo', state: outerState }],
  };
  const registry: RouterRegistry = new Map([
    ['root', entry(StackRouter({}), rootState.routeNames)],
    ['outer-foo', entry(StackRouter({}), outerState.routeNames)],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [
        {
          name: 'foo',
          state: { routes: [{ name: 'foo', state: { routes: [{ name: 'bar' }] } }] },
        },
      ],
    },
    navigationState: rootState,
    routeNode: node('root', [outerFoo]),
    registry,
    action: { type: 'NAVIGATE', payload: {} },
  });

  expect(action.target).toBe('outer-foo');
  expect(action.payload.state?.routes[0]?.name).toBe('bar');
});

test('preloads a parent without focusing it and resolves its child', () => {
  const stack: NavigationState = {
    stale: false,
    routeKeySeq: 0,
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
    routeKeySeq: 0,
    type: 'stack',
    key: 'settings-stack',
    index: 0,
    routeNames: ['index', 'details'],
    routes: [{ key: 'index-key', name: 'index' }],
  };
  const tabs: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    type: 'tab',
    key: 'tabs',
    index: 0,
    routeNames: ['home', 'settings'],
    routes: [
      { key: 'home-key', name: 'home' },
      { key: 'settings:0', name: 'settings', state: settingsStack },
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
    routeKeySeq: 0,
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

test('strips source, target and first-level options from deeper actions', () => {
  const child: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    key: 'child-stack',
    index: 0,
    routeNames: ['details'],
    routes: [{ key: 'details-key', name: 'details' }],
  };
  const root: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings:0', name: 'settings', state: child }],
  };
  const childActions: NavigationAction[] = [];
  const childRouter = StackRouter({});
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), root.routeNames)],
    [
      'child-stack',
      {
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
    routeKeySeq: 0,
    key: 'child-stack',
    index: 0,
    routeNames: ['details'],
    routes: [{ key: 'details-key', name: 'details' }],
  };
  const root: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings:0', name: 'settings', state: child }],
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
    routeKeySeq: 0,
    type: 'stack',
    key: 'root-stack',
    index: 0,
    routeNames: ['settings'],
    routes: [{ key: 'settings:0', name: 'settings' }],
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

test('throws for an unsupported destination action', () => {
  expect(() =>
    resolveNavigationDestination({
      targetState: { routes: [{ name: 'home' }] },
      navigationState: tabs,
      routeNode: node('tabs', [node('home'), node('settings')]),
      registry: new Map(),
      action: { type: 'GO_BACK', payload: {} },
    })
  ).toThrow('Unsupported destination action type: GO_BACK');
});

test('does not descend into a mounted dynamic route with a different param', () => {
  const details: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    key: 'details-stack',
    index: 0,
    routeNames: ['index'],
    routes: [{ key: 'index-key', name: 'index' }],
  };
  const stack: NavigationState = {
    stale: false,
    routeKeySeq: 0,
    key: 'root-stack',
    index: 0,
    routeNames: ['[id]'],
    routes: [{ key: '[id]:0', name: '[id]', params: { id: 'one' }, state: details }],
  };
  const registry: RouterRegistry = new Map([
    ['root-stack', entry(StackRouter({}), stack.routeNames)],
    ['details-stack', entry(StackRouter({}), details.routeNames)],
  ]);

  const action = resolveNavigationDestination({
    targetState: {
      routes: [{ name: '[id]', params: { id: 'two' }, state: { routes: [{ name: 'index' }] } }],
    },
    navigationState: stack,
    routeNode: node('root', [node('[id]', [node('index')])]),
    registry,
    action: { type: 'NAVIGATE', payload: {} },
  });

  expect(action.target).toBe('root-stack');
  expect(action.payload.params).toEqual({ id: 'two' });
  expect(action.payload.state?.routes[0]?.name).toBe('index');
});
