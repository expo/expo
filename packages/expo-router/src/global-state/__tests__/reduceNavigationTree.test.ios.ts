import type { NavigationAction, NavigationState } from '../../react-navigation/routers';
import { indexNavigationTree, reduceNavigationTree, resolveOrigin } from '../reduceNavigationTree';
import type { RouterRegistry, RouterRegistryEntry } from '../routerRegistry';

const staleStateError =
  'Cannot reduce a stale navigation state. Expo Router requires a complete state tree before handling actions, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.';

const child: NavigationState = {
  stale: false,
  key: 'child',
  index: 0,
  routeNames: ['a', 'b'],
  routes: [
    { key: 'a', name: 'a' },
    { key: 'b', name: 'b' },
  ],
};
const sibling: NavigationState = { ...child, key: 'sibling' };
const root: NavigationState = {
  stale: false,
  key: 'root',
  index: 0,
  routeNames: ['nested', 'other'],
  routes: [
    { key: 'nested', name: 'nested', state: child },
    { key: 'other', name: 'other' },
  ],
};

function entry(reduce: RouterRegistryEntry['reduce']): RouterRegistryEntry {
  return {
    reduce,
    shouldActionChangeFocus: () => false,
    getStateForRouteFocus: (state) => state,
    shouldPreventRemove: () => false,
    emitBeforeRemove: () => {},
  };
}

it('rejects a stale root state when indexing the tree', () => {
  // `NavigationState` excludes stale states, so the cast creates invalid runtime input.
  const staleRoot = { ...root, stale: true } as unknown as NavigationState;

  expect(() => indexNavigationTree(staleRoot)).toThrow(staleStateError);
});

it('rejects a stale nested state when indexing the tree', () => {
  // `NavigationState` excludes stale states, so the cast creates invalid runtime input.
  const staleChild = { ...child, stale: true } as unknown as NavigationState;
  const rootWithStaleChild = {
    ...root,
    routes: [{ ...root.routes[0]!, state: staleChild }, root.routes[1]!],
  };

  expect(() => indexNavigationTree(rootWithStaleChild)).toThrow(staleStateError);
});

it('rejects a stale state when resolving the origin', () => {
  // `NavigationState` excludes stale states, so the cast creates invalid runtime input.
  const staleRoot = { ...root, stale: true } as unknown as NavigationState;

  expect(() => resolveOrigin({ state: staleRoot }, new Map(), new Map())).toThrow(staleStateError);
});

it('bubbles from the deepest focused navigator to its parent', () => {
  const calls: string[] = [];
  const registry: RouterRegistry = new Map([
    [
      'child',
      entry(() => {
        calls.push('child');
        return null;
      }),
    ],
    [
      'root',
      entry((state) => {
        calls.push('root');
        return { state: { ...state, index: 1 }, affectedRouteKey: 'other' };
      }),
    ],
  ]);

  const result = reduceNavigationTree(root, { type: 'TEST' }, registry, {});

  expect(calls).toEqual(['child', 'root']);
  expect(result).toMatchObject({
    handled: true,
    handlerNoop: false,
    treeChanged: true,
  });
  if (result.handled) {
    expect(result.nextState.index).toBe(1);
    expect(result.target.stateKey).toBe('root');
  }
});

it('handles an unsupported targeted action as a no-op', () => {
  const action: NavigationAction = { type: 'TEST', target: 'child' };
  const result = reduceNavigationTree(root, action, new Map([['child', entry(() => null)]]), {
    originKey: 'child',
  });

  expect(result).toEqual({
    handled: true,
    handlerNoop: true,
    treeChanged: false,
    nextState: root,
    originStateKey: 'child',
    target: { stateKey: 'child', prevSlice: child, nextSlice: child },
  });
});

it('looks up a targeted sibling directly', () => {
  const rootWithSibling: NavigationState = {
    ...root,
    routes: [root.routes[0]!, { ...root.routes[1]!, state: sibling }],
  };
  const result = reduceNavigationTree(
    rootWithSibling,
    { type: 'TEST', target: 'sibling' },
    new Map([
      ['child', entry(() => null)],
      [
        'sibling',
        entry((state) => ({
          state: { ...state, index: 1 },
          affectedRouteKey: state.routes[1]?.key,
        })),
      ],
    ]),
    { originKey: 'child' }
  );

  expect(result).toMatchObject({
    handled: true,
    target: { stateKey: 'sibling' },
    nextState: { routes: [{ state: child }, { state: { index: 1 } }] },
  });
});

it('focuses ancestors even when the handling navigator is a no-op', () => {
  const childEntry = entry((state) => ({
    state,
    affectedRouteKey: state.routes[0]?.key,
  }));
  childEntry.shouldActionChangeFocus = () => true;
  const rootEntry = entry(() => null);
  rootEntry.getStateForRouteFocus = (state, routeKey) => ({
    ...state,
    index: state.routes.findIndex((route) => route.key === routeKey),
  });
  const unfocusedRoot = { ...root, index: 1 };

  const result = reduceNavigationTree(
    unfocusedRoot,
    { type: 'NAVIGATE' },
    new Map([
      ['root', rootEntry],
      ['child', childEntry],
    ]),
    { originKey: 'child' }
  );

  expect(result).toMatchObject({
    handled: true,
    handlerNoop: true,
    treeChanged: true,
  });
  if (result.handled) {
    expect(result.nextState.index).toBe(0);
  }
});
