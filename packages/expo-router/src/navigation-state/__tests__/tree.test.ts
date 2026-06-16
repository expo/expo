import { focusedChain, ROOT_NAME } from '../tree';
import type { NavNode } from '../types';

// The focused-path walk that back-bubbling and (future) action resolution rely on.

describe('focusedChain', () => {
  it('walks to the leaf, keying each node by its owning route name (root by ROOT_NAME)', () => {
    const leaf: NavNode = { key: 'lvl3', index: 0, routes: [{ key: 'a#k', name: 'a' }] };
    const mid: NavNode = {
      key: 'lvl2',
      index: 0,
      routes: [{ key: 'm#k', name: 'm', child: leaf }],
    };
    const root: NavNode = {
      key: 'lvl1',
      index: 0,
      routes: [{ key: 'r#k', name: 'r', child: mid }],
    };
    expect(focusedChain(root)).toEqual([
      { node: root, name: ROOT_NAME },
      { node: mid, name: 'r' }, // keyed by owning route, not node.key
      { node: leaf, name: 'm' },
    ]);
  });

  it('follows index, not array position', () => {
    const childA: NavNode = { key: 'a.child', index: 0, routes: [{ key: 'x#k', name: 'x' }] };
    const childB: NavNode = { key: 'b.child', index: 0, routes: [{ key: 'y#k', name: 'y' }] };
    const root: NavNode = {
      key: 'root',
      index: 1,
      routes: [
        { key: 'a#0', name: 'a', child: childA },
        { key: 'b#1', name: 'b', child: childB },
      ],
    };
    expect(focusedChain(root).map((f) => f.name)).toEqual([ROOT_NAME, 'b']); // descends into focused b
  });

  it('stops at a leaf node (no child)', () => {
    expect(focusedChain({ key: 'r', index: 0, routes: [{ key: 'a#k', name: 'a' }] })).toHaveLength(
      1
    );
  });

  it('returns root-only when index is out of range or routes are empty', () => {
    expect(focusedChain({ key: 'r', index: 5, routes: [{ key: 'a#k', name: 'a' }] })).toHaveLength(
      1
    );
    expect(focusedChain({ key: 'r', index: 0, routes: [] })).toHaveLength(1);
  });
});
