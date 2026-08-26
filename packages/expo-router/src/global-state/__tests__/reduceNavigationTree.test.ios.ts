import type { NavigationAction, NavigationState } from '../../react-navigation/routers';
import { indexNavigationTree, reduceNavigationTree, resolveOrigin } from '../reduceNavigationTree';
import type { RouterRegistry } from '../routerRegistry';
import { entry } from './__fixtures__/routerEntry';

const staleStateError =
  'Cannot reduce a stale navigation state. Expo Router requires a complete state tree before handling actions, so this is most likely a bug in expo-router. Please report it at https://github.com/expo/expo/issues.';

const child: NavigationState = {
  stale: false,
  routeKeySeq: 0,
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
  routeKeySeq: 0,
  key: 'root',
  index: 0,
  routeNames: ['nested', 'other'],
  routes: [
    { key: 'nested', name: 'nested', state: child },
    { key: 'other', name: 'other' },
  ],
};

function reduce(
  root: NavigationState,
  action: NavigationAction,
  registry: RouterRegistry,
  originKey?: string
) {
  const tree = indexNavigationTree(root);
  const origin = resolveOrigin(tree.rootNode, tree.nodes, registry, originKey);
  if (!origin) {
    throw new Error('Expected the test registry to provide an origin navigator.');
  }
  return reduceNavigationTree(action, registry, { origin, tree });
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

  const result = reduce(root, { type: 'TEST' }, registry);

  expect(calls).toEqual(['child', 'root']);
  expect(result).toMatchObject({ handled: true });
  if (result.handled) {
    expect(result.nextState.index).toBe(1);
  }
});

it('handles an unsupported targeted action as a no-op', () => {
  const action: NavigationAction = { type: 'TEST', target: 'child' };
  const result = reduce(root, action, new Map([['child', entry(() => null)]]), 'child');

  expect(result).toMatchObject({ handled: true });
  if (result.handled) {
    expect(result.nextState).toBe(root);
  }
});

it('returns unhandled when no navigator handles an untargeted action', () => {
  const registry: RouterRegistry = new Map([
    ['root', entry(() => null)],
    ['child', entry(() => null)],
  ]);

  expect(reduce(root, { type: 'TEST' }, registry)).toEqual({ handled: false });
});

it('returns unhandled for an unknown target', () => {
  expect(
    reduce(root, { type: 'TEST', target: 'missing' }, new Map([['root', entry(() => null)]]))
  ).toEqual({ handled: false });
});

it('looks up a targeted sibling directly', () => {
  const rootWithSibling: NavigationState = {
    ...root,
    routes: [root.routes[0]!, { ...root.routes[1]!, state: sibling }],
  };
  const result = reduce(
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
    'child'
  );

  expect(result).toMatchObject({
    handled: true,
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

  const result = reduce(
    unfocusedRoot,
    { type: 'NAVIGATE' },
    new Map([
      ['root', rootEntry],
      ['child', childEntry],
    ]),
    'child'
  );

  expect(result).toMatchObject({ handled: true });
  if (result.handled) {
    expect(result.nextState.index).toBe(0);
  }
});
