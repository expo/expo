import { reduce } from '../reducer';
import type { GlobalNavState, NavNode } from '../types';

// The dumb reducer (Decisions R-13): replace one node by key with the router's computed next subtree.

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const tree = (): GlobalNavState => ({
  root: {
    key: 'root',
    index: 0,
    routes: [
      {
        key: 'home#0',
        name: 'home',
        child: { key: 'home.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
      },
    ],
  },
});

it('replaces the targeted node, rebuilding the spine above it', () => {
  const before = tree();
  const next: NavNode = {
    key: 'home.stack',
    index: 1,
    routes: [
      { key: 'index#0', name: 'index' },
      { key: 'details#1', name: 'details' },
    ],
  };
  const after = reduce(before, { key: 'home.stack', next, source: 'js' });
  expect(after.root.routes[0]!.child).toBe(next); // swapped in
  expect(after.root).not.toBe(before.root); // spine rebuilt
});

it('replaces the root when targeted by the root key', () => {
  const before = tree();
  const next: NavNode = { key: 'root', index: 0, routes: [{ key: 'a#0', name: 'a' }] };
  expect(reduce(before, { key: 'root', next, source: 'js' }).root).toBe(next);
});

it('returns the identical state when the key matches no node (bail-out)', () => {
  const before = tree();
  const after = reduce(before, { key: 'nope', next: before.root, source: 'js' });
  expect(after).toBe(before);
});

it('does not mutate prevState; ignores source (js vs native converge)', () => {
  const before = tree();
  const snapshot = clone(before);
  const next: NavNode = {
    key: 'home.stack',
    index: 0,
    routes: [{ key: 'index#0', name: 'index' }],
  };
  const asJs = reduce(before, { key: 'home.stack', next, source: 'js' });
  const asNative = reduce(before, { key: 'home.stack', next, source: 'native' });
  expect(before).toEqual(snapshot); // untouched
  expect(asNative).toEqual(asJs); // provenance does not change state (P-6)
});
