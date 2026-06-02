import { commitSlices, navReducer, replaceRoot, reset, seed } from '../navReducer';
import type { NavigationTree } from '../types';

function makeTree(): NavigationTree {
  return {
    key: 'root',
    index: 0,
    type: 'stack',
    routeNames: ['(tabs)'],
    stale: false,
    routes: [
      {
        key: 'r1',
        name: '(tabs)',
        state: {
          key: 'tabs',
          index: 0,
          type: 'tab',
          routeNames: ['index', 'settings'],
          stale: false,
          routes: [
            { key: 't1', name: 'index' },
            { key: 't2', name: 'settings' },
          ],
        },
      },
    ],
  } as NavigationTree;
}

const slice = (key: string, index = 0): NavigationTree =>
  ({ key, index, type: 'stack', routeNames: [], stale: false, routes: [] }) as NavigationTree;

describe('navReducer', () => {
  it('SEED / REPLACE_ROOT / RESET publish the action tree wholesale', () => {
    const a = makeTree();
    const b = makeTree();
    expect(navReducer(a, seed(b))).toBe(b);
    expect(navReducer(a, replaceRoot(b))).toBe(b);
    expect(navReducer(a, reset(b))).toBe(b);
  });

  it('COMMIT_SLICES replaces an addressed slice with structural sharing', () => {
    const tree = makeTree();
    const tabs = slice('tabs', 1);
    const next = navReducer(tree, commitSlices([{ key: 'tabs', slice: tabs }]));

    expect(next.routes[0].state).toBe(tabs);
    expect(next).not.toBe(tree);
  });

  it('COMMIT_SLICES is a no-op (same reference) for unknown keys', () => {
    const tree = makeTree();
    expect(navReducer(tree, commitSlices([{ key: 'nope', slice: slice('nope') }]))).toBe(tree);
  });

  it('COMMIT_SLICES applies multiple slices across nesting levels in dispatch order', () => {
    const tree = makeTree();
    const newRoot = {
      ...makeTree(),
      index: 2,
      // child slice will be re-applied on top of this root
    } as NavigationTree;
    const tabs = slice('tabs', 1);

    const next = navReducer(
      tree,
      commitSlices([
        { key: 'root', slice: newRoot },
        { key: 'tabs', slice: tabs },
      ])
    );

    // Root replaced first, then the tabs slice composed into the new root.
    expect(next.index).toBe(2);
    expect(next.routes[0].state).toBe(tabs);
  });

  it('dispatch order matters: an ancestor slice listed after a descendant clobbers it', () => {
    // Documents the producer contract: useNavigationBuilder must commit parent-before-child.
    // If a parent slice is applied last and carries a stale child, the earlier child write is lost.
    const tree = makeTree();
    const tabs = slice('tabs', 1);
    const staleRoot = makeTree(); // its tabs slice is the original (index 0)

    const next = navReducer(
      tree,
      commitSlices([
        { key: 'tabs', slice: tabs }, // descendant first
        { key: 'root', slice: staleRoot }, // ancestor last → wins, discarding `tabs`
      ])
    );

    expect(next.routes[0].state).not.toBe(tabs);
    expect((next.routes[0].state as NavigationTree).index).toBe(0);
  });

  it('COMMIT_SLICES tolerates a key whose child slot was never seeded (lazy navigator)', () => {
    // A tab route that has not yet mounted its nested navigator (no `.state`).
    const tree = makeTree();
    (tree.routes[0].state as NavigationTree).routes[1] = {
      key: 't2',
      name: 'settings',
    } as NavigationTree['routes'][number];

    // Committing a slice for the not-yet-existing nested navigator is a safe no-op.
    const next = navReducer(
      tree,
      commitSlices([{ key: 'lazy-stack', slice: slice('lazy-stack') }])
    );
    expect(next).toBe(tree);
  });

  it('returns the current tree for an unknown action type', () => {
    const tree = makeTree();
    expect(navReducer(tree, { type: 'UNKNOWN' } as any)).toBe(tree);
  });
});
