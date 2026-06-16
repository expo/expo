import { hydrate, treeFromNavigationState } from '../hydration';
import type { NavNode } from '../types';

// Phase 2 — hydrate the minimal active path from a URL (RFC scenario 1/1b).

function collectKeys(node: NavNode, keys: string[] = []): string[] {
  keys.push(node.key);
  for (const route of node.routes) {
    keys.push(route.key);
    if (route.child) collectKeys(route.child, keys);
  }
  return keys;
}

describe('treeFromNavigationState (pure converter)', () => {
  it('converts a nested partial state into a homogeneous tree (scenario 1)', () => {
    const tree = treeFromNavigationState({
      routes: [{ name: 'home', state: { routes: [{ name: 'index' }] } }],
    });
    expect(tree.root.routes[0].name).toBe('home');
    expect(tree.root.index).toBe(0);
    const homeChild = tree.root.routes[0].child!;
    expect(homeChild.routes.map((r) => r.name)).toEqual(['index']);
    expect(homeChild.index).toBe(0);
  });

  it('reflects an inserted initialRouteName anchor with focus on the deep route (scenario 1b)', () => {
    const tree = treeFromNavigationState({
      routes: [
        {
          name: 'home',
          state: {
            index: 1,
            routes: [{ name: 'index' }, { name: 'details', params: { id: '42' } }],
          },
        },
      ],
    });
    const stack = tree.root.routes[0].child!;
    expect(stack.routes.map((r) => r.name)).toEqual(['index', 'details']);
    expect(stack.index).toBe(1);
    expect(stack.routes[1].params).toEqual({ id: '42' });
  });

  it('keeps every sibling and its child, honoring a non-default index (multi-route node)', () => {
    // This multi-route shape cannot come from a single URL (which hydrates one branch), so it can
    // only be reached via the pure converter — and it is the shape the homogeneous tree exists for.
    const tree = treeFromNavigationState({
      index: 0,
      routes: [
        { name: 'home', state: { routes: [{ name: 'index' }] } },
        { name: 'search', state: { index: 1, routes: [{ name: 'index' }, { name: 'results' }] } },
      ],
    });
    expect(tree.root.routes.map((r) => r.name)).toEqual(['home', 'search']);
    expect(tree.root.index).toBe(0);
    expect(tree.root.routes[1].child!.routes.map((r) => r.name)).toEqual(['index', 'results']);
    expect(tree.root.routes[1].child!.index).toBe(1);
  });

  it('mints tree-globally-unique keys even when a route name repeats across branches', () => {
    const tree = treeFromNavigationState({
      routes: [
        { name: 'home', state: { routes: [{ name: 'index' }] } },
        { name: 'search', state: { routes: [{ name: 'index' }] } }, // duplicate `index` name
      ],
    });
    const keys = collectKeys(tree.root);
    expect(new Set(keys).size).toBe(keys.length); // no collisions
    expect(keys.filter((k) => /^index#\d+$/.test(k))).toHaveLength(2); // both `index` routes minted uniquely
  });

  it('defaults index to the last route when the partial state omits it', () => {
    expect(treeFromNavigationState({ routes: [{ name: 'a' }, { name: 'b' }] }).root.index).toBe(1);
  });
});

describe('hydrate (integration with the real getStateFromPath — independent oracle)', () => {
  const options = {
    screens: {
      home: {
        path: 'home',
        initialRouteName: 'index',
        screens: { index: '', details: 'details/:id' },
      },
      search: { path: 'search', initialRouteName: 'index', screens: { index: '' } },
    },
  } as const;

  it('hydrates a minimal active path: only the matched branch exists (scenario 1)', () => {
    const tree = hydrate('/home', options)!;
    expect(tree.root.routes.map((r) => r.name)).toEqual(['home']); // search is NOT in state
    expect(tree.root.routes[0].child!.routes.map((r) => r.name)).toEqual(['index']);
  });

  it('hydrates a deep link with the anchor seeded underneath, params parsed (scenario 1b)', () => {
    const tree = hydrate('/home/details/42', options)!;
    const stack = tree.root.routes[0].child!;
    expect(stack.routes.map((r) => r.name)).toEqual(['index', 'details']);
    expect(stack.index).toBe(1);
    expect(stack.routes[1].params).toMatchObject({ id: '42' }); // param parsed by the real matcher
  });

  it('returns undefined when no screen matches the path', () => {
    expect(hydrate('/does-not-exist', { screens: { home: 'home' } })).toBeUndefined();
  });
});
