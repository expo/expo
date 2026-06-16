import { resolve } from '../behaviors';
import type { NavNode } from '../types';

// Phase 0 — the resolution seam (RFC C12-C, Decisions P-2/P-4/P-5/P-7).
//
// Proves intent → primitive-op resolution is render-free and decides ops purely from the node's
// current state — including promoting a tab that is absent from the node (the C12 thesis). No
// reducer, no React.

const stack = (routeNames: string[], index = routeNames.length - 1): NavNode => ({
  key: 'n.stack',
  index,
  routes: routeNames.map((name) => ({ key: `${name}#k`, name })),
});

const tabs = (names: string[], index = 0): NavNode => ({
  key: 'root',
  index,
  routes: names.map((name) => ({ key: `${name}#k`, name })),
});

describe('stack behavior', () => {
  it('push appends the route and focuses it', () => {
    expect(
      resolve(
        { type: 'push', route: { key: 'details#1', name: 'details' } },
        stack(['index']),
        'stack'
      )
    ).toEqual([
      { type: 'insert', target: 'n.stack', route: { key: 'details#1', name: 'details' } },
      { type: 'setIndex', target: 'n.stack', index: 1 },
    ]);
  });

  it('goBack removes the focused top and decrements index (RFC scenario 5)', () => {
    expect(resolve({ type: 'goBack' }, stack(['index', 'list', 'details']), 'stack')).toEqual([
      { type: 'remove', target: 'n.stack', routeKeys: ['details#k'] },
      { type: 'setIndex', target: 'n.stack', index: 1 },
    ]);
  });

  it('goBack at the root is a no-op (cannot pop the anchor)', () => {
    expect(resolve({ type: 'goBack' }, stack(['index']), 'stack')).toEqual([]);
  });

  it('popTo removes everything above the target route (native multi-level pop)', () => {
    expect(
      resolve(
        { type: 'popTo', routeKey: 'list#k' },
        stack(['index', 'list', 'details', 'more']),
        'stack'
      )
    ).toEqual([
      { type: 'remove', target: 'n.stack', routeKeys: ['details#k', 'more#k'] },
      { type: 'setIndex', target: 'n.stack', index: 1 },
    ]);
  });

  it('popTo an absent route is a no-op (idempotent reconciliation, P-7)', () => {
    expect(
      resolve({ type: 'popTo', routeKey: 'ghost#k' }, stack(['index', 'list']), 'stack')
    ).toEqual([]);
  });

  it('popToTop removes everything above the anchor', () => {
    expect(resolve({ type: 'popToTop' }, stack(['index', 'list', 'details']), 'stack')).toEqual([
      { type: 'remove', target: 'n.stack', routeKeys: ['list#k', 'details#k'] },
      { type: 'setIndex', target: 'n.stack', index: 0 },
    ]);
  });

  it('focus pops back to the route when it is already in history (navigate semantics)', () => {
    expect(
      resolve(
        { type: 'focus', route: { key: 'whatever', name: 'list' } },
        stack(['index', 'list', 'details']),
        'stack'
      )
    ).toEqual([
      { type: 'remove', target: 'n.stack', routeKeys: ['details#k'] },
      { type: 'setIndex', target: 'n.stack', index: 1 },
    ]);
  });

  it('focus pushes the route when it is not in history', () => {
    expect(
      resolve({ type: 'focus', route: { key: 'new#1', name: 'new' } }, stack(['index']), 'stack')
    ).toEqual([
      { type: 'insert', target: 'n.stack', route: { key: 'new#1', name: 'new' } },
      { type: 'setIndex', target: 'n.stack', index: 1 },
    ]);
  });
});

describe('tabs behavior', () => {
  it('focus an ALREADY-PROMOTED tab is set-index computed from node state, no route removed (scenario 4)', () => {
    const node = tabs(['home', 'search'], 0);
    // The route the caller passes carries a DIFFERENT key than what is in state; resolution must
    // still target the existing tab by computing its index from the node, not echoing caller data.
    expect(
      resolve({ type: 'focus', route: { key: 'search#caller', name: 'search' } }, node, 'tabs')
    ).toEqual([{ type: 'setIndex', target: 'root', index: 1 }]);
  });

  it('THESIS (P-5): focus a tab ABSENT from the node decides to promote it, render-free', () => {
    const node = tabs(['home'], 0); // only `home` is promoted
    expect(node.routes.some((r) => r.name === 'search')).toBe(false); // precondition: search absent

    const searchBranch = {
      key: 'search#1',
      name: 'search',
      child: { key: 'search.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
    };
    // Resolution decides insert-vs-setindex purely from the node's state. (Constructing the branch
    // content from static config is Phase 2; here it is supplied to isolate the decision.)
    expect(resolve({ type: 'focus', route: searchBranch }, node, 'tabs')).toEqual([
      { type: 'insert', target: 'root', route: searchBranch },
      { type: 'setIndex', target: 'root', index: 1 },
    ]);
  });

  it('goBack alone yields no ops — refocusing the previous tab is the Phase 3 back resolver', () => {
    expect(resolve({ type: 'goBack' }, tabs(['home', 'search'], 1), 'tabs')).toEqual([]);
  });
});

describe('resolve seam', () => {
  it('the same intent resolves to DIFFERENT ops by behavior — the C12 distinction', () => {
    const node: NavNode = {
      key: 'x',
      index: 1,
      routes: [
        { key: 'a#k', name: 'a' },
        { key: 'b#k', name: 'b' },
      ],
    };
    expect(resolve({ type: 'goBack' }, node, 'stack').some((op) => op.type === 'remove')).toBe(
      true
    ); // stack pops
    expect(resolve({ type: 'goBack' }, node, 'tabs').some((op) => op.type === 'remove')).toBe(
      false
    ); // tabs never pop
  });
});
