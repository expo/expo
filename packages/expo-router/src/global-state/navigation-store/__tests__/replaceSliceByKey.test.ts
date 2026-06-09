import { replaceSliceByKey } from '../replaceSliceByKey';
import type { NavigationTree } from '../types';

/**
 * Build a representative nested tree:
 *   root (stack, key=root)
 *     ├─ r1 "(tabs)" → tabs (tab, key=tabs)
 *     │     ├─ t1 "index"
 *     │     └─ t2 "settings" → sstack (stack, key=sstack) ├─ s1 "settings/index"
 *     └─ r2 "modal"
 */
function makeTree(): NavigationTree {
  return {
    key: 'root',
    index: 0,
    type: 'stack',
    routeNames: ['(tabs)', 'modal'],
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
            {
              key: 't2',
              name: 'settings',
              state: {
                key: 'sstack',
                index: 0,
                type: 'stack',
                routeNames: ['settings/index'],
                stale: false,
                routes: [{ key: 's1', name: 'settings/index' }],
              },
            },
          ],
        },
      },
      { key: 'r2', name: 'modal' },
    ],
  } as NavigationTree;
}

const newSlice = (key: string): NavigationTree =>
  ({ key, index: 0, type: 'stack', routeNames: [], stale: false, routes: [] }) as NavigationTree;

describe('replaceSliceByKey', () => {
  it('replaces the root when the root key matches', () => {
    const tree = makeTree();
    const slice = newSlice('root');
    expect(replaceSliceByKey(tree, 'root', slice)).toBe(slice);
  });

  it('returns the same tree reference (no-op) when the key is not found', () => {
    const tree = makeTree();
    expect(replaceSliceByKey(tree, 'does-not-exist', newSlice('x'))).toBe(tree);
  });

  it('replaces a nested slice and shares untouched sibling branches by reference', () => {
    const tree = makeTree();
    const slice = newSlice('tabs');
    const next = replaceSliceByKey(tree, 'tabs', slice);

    expect(next).not.toBe(tree);
    // The targeted slice is swapped in.
    expect(next.routes[0].state).toBe(slice);
    // The untouched sibling route keeps its identity.
    expect(next.routes[1]).toBe(tree.routes[1]);
    // The routes array is rebuilt (the changed child forces a new array)...
    expect(next.routes).not.toBe(tree.routes);
    // ...but unrelated top-level fields are preserved.
    expect(next.key).toBe('root');
  });

  it('replaces a deeply nested slice, preserving identity along untouched paths', () => {
    const tree = makeTree();
    const slice = newSlice('sstack');
    const next = replaceSliceByKey(tree, 'sstack', slice);

    const tabsBefore = tree.routes[0].state!;
    const tabsAfter = next.routes[0].state!;

    // The whole spine to the target is rebuilt...
    expect(tabsAfter).not.toBe(tabsBefore);
    expect(tabsAfter.routes[1].state).toBe(slice);
    // ...but the untouched tab sibling (t1) keeps identity.
    expect(tabsAfter.routes[0]).toBe(tabsBefore.routes[0]);
    // ...and the untouched modal route keeps identity.
    expect(next.routes[1]).toBe(tree.routes[1]);
  });

  it('preserves preloadedRoutes array identity when an unrelated slice changes', () => {
    const tree = makeTree();
    const preloaded = [{ key: 'p1', name: 'preview' }];
    (tree as any).preloadedRoutes = preloaded;

    const next = replaceSliceByKey(tree, 'tabs', newSlice('tabs'));

    // The RNS link-preview workaround relies on preloaded entries staying referentially stable.
    expect((next as any).preloadedRoutes).toBe(preloaded);
  });

  it('addresses a navigator nested inside a preloaded route', () => {
    const tree = makeTree();
    (tree as any).preloadedRoutes = [
      {
        key: 'p1',
        name: 'preview',
        state: {
          key: 'preview-stack',
          index: 0,
          type: 'stack',
          routeNames: [],
          stale: false,
          routes: [],
        },
      },
    ];
    const slice = newSlice('preview-stack');
    const next = replaceSliceByKey(tree, 'preview-stack', slice);

    expect((next as any).preloadedRoutes[0].state).toBe(slice);
    // The main routes are untouched and keep identity.
    expect(next.routes).toBe(tree.routes);
  });
});
