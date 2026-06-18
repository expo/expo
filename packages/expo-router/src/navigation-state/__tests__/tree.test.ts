import { focusedChain } from '../tree';
import type { NavNode } from '../types';

// The focused-path walk back-bubbling relies on (Decisions R-13).

describe('focusedChain', () => {
  it('walks to the focused leaf, outermost first', () => {
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
    expect(focusedChain(root)).toEqual([root, mid, leaf]);
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
    expect(focusedChain(root).map((n) => n.key)).toEqual(['root', 'b.child']); // descends into focused b
  });

  it('stops at a leaf, and returns root-only for out-of-range/empty', () => {
    expect(focusedChain({ key: 'r', index: 0, routes: [{ key: 'a#k', name: 'a' }] })).toHaveLength(
      1
    );
    expect(focusedChain({ key: 'r', index: 5, routes: [{ key: 'a#k', name: 'a' }] })).toHaveLength(
      1
    );
    expect(focusedChain({ key: 'r', index: 0, routes: [] })).toHaveLength(1);
  });
});
