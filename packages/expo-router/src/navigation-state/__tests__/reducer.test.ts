import { resolve } from '../behaviors';
import { reduce } from '../reducer';
import type { GlobalNavState, NavNode, PrimitiveOp } from '../types';

// Phase 1 — the dumb, pure, synchronous reducer (RFC D5/D12, Decisions P-3/P-6/P-7).
//
// Applies primitive ops to the tree: pure (derives only from prevState), ignores `source`, dedupes
// inserts by key, treats removing an absent route as identity.

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const homeStack = (routeNames: string[], index = routeNames.length - 1): NavNode => ({
  key: 'home.stack',
  index,
  routes: routeNames.map((name) => ({ key: `${name}#k`, name })),
});

const state = (root: NavNode): GlobalNavState => ({ root });

describe('primitive ops', () => {
  it('insert appends a route, preserving params, without touching index', () => {
    const before = state(homeStack(['index'])); // @0
    const after = reduce(before, {
      ops: [
        {
          type: 'insert',
          target: 'home.stack',
          route: { key: 'details#1', name: 'details', params: { id: '42' } },
        },
      ],
      source: 'js',
    });
    expect(after.root.routes.map((r) => r.name)).toEqual(['index', 'details']);
    expect(after.root.routes[1].params).toEqual({ id: '42' });
    expect(after.root.index).toBe(0);
  });

  it('insert is idempotent by key — a native echo of a JS push does not duplicate (P-6/P-7)', () => {
    // The same logical push arriving from JS then echoed by native must converge to ONE route.
    const before = state(homeStack(['index']));
    const op: PrimitiveOp = {
      type: 'insert',
      target: 'home.stack',
      route: { key: 'details#1', name: 'details' },
    };
    const fromJs = reduce(before, { ops: [op], source: 'js' });
    const thenNative = reduce(fromJs, { ops: [op], source: 'native' });
    expect(thenNative.root.routes.map((r) => r.key)).toEqual(['index#k', 'details#1']);
    expect(thenNative).toEqual(fromJs); // js vs native converge — provenance does not change state (P-6)
  });

  it('remove drops the named routes and keeps index a valid structural value', () => {
    const before = state(homeStack(['index', 'list', 'details'])); // @2
    const after = reduce(before, {
      ops: [{ type: 'remove', target: 'home.stack', routeKeys: ['details#k'] }],
      source: 'js',
    });
    expect(after.root.routes.map((r) => r.name)).toEqual(['index', 'list']);
    expect(after.root.index).toBe(1); // not left dangling at the removed slot
  });

  it('remove of an absent key is identity (idempotent reconciliation, P-7)', () => {
    const before = state(homeStack(['index', 'list']));
    const after = reduce(before, {
      ops: [{ type: 'remove', target: 'home.stack', routeKeys: ['ghost#k'] }],
      source: 'native',
    });
    expect(after).toBe(before); // same reference — enables React bail-out
  });

  it('an op whose target matches NO node returns the identical state (bail-out)', () => {
    const before = state(homeStack(['index']));
    const after = reduce(before, {
      ops: [{ type: 'insert', target: 'nonexistent', route: { key: 'x#1', name: 'x' } }],
      source: 'js',
    });
    expect(after).toBe(before);
  });

  it('setIndex clamps out-of-range values to the structural bounds', () => {
    const before = state(homeStack(['index', 'list'], 0));
    expect(
      reduce(before, { ops: [{ type: 'setIndex', target: 'home.stack', index: 9 }], source: 'js' })
        .root.index
    ).toBe(1);
    expect(
      reduce(before, { ops: [{ type: 'setIndex', target: 'home.stack', index: -3 }], source: 'js' })
        .root.index
    ).toBe(0);
  });

  it('targets a NESTED node by key (rebuilds the immutable spine)', () => {
    const before = state({
      key: 'root',
      index: 0,
      routes: [{ key: 'home#0', name: 'home', child: homeStack(['index']) }],
    });
    const after = reduce(before, {
      ops: [
        { type: 'insert', target: 'home.stack', route: { key: 'details#1', name: 'details' } },
        { type: 'setIndex', target: 'home.stack', index: 1 },
      ],
      source: 'js',
    });
    expect(after.root.routes[0].child?.routes.map((r) => r.name)).toEqual(['index', 'details']);
    expect(after.root.routes[0].child?.index).toBe(1);
  });

  it('one action can touch TWO different nodes — the cross-tab batch (RFC scenario 4)', () => {
    const before = state({
      key: 'root',
      index: 0,
      routes: [{ key: 'home#0', name: 'home', child: homeStack(['index']) }],
    });
    const searchBranch = {
      key: 'search#1',
      name: 'search',
      child: { key: 'search.stack', index: 0, routes: [{ key: 'index#0', name: 'index' }] },
    };
    const after = reduce(before, {
      ops: [
        { type: 'insert', target: 'root', route: searchBranch }, // promote a tab on `root`
        { type: 'setIndex', target: 'root', index: 1 },
        { type: 'insert', target: 'search.stack', route: { key: 'detail#9', name: 'detail' } }, // deep nav inside it
        { type: 'setIndex', target: 'search.stack', index: 1 },
      ],
      source: 'js',
    });
    expect(after.root.index).toBe(1);
    expect(after.root.routes[1].child?.routes.map((r) => r.name)).toEqual(['index', 'detail']);
    expect(after.root.routes[1].child?.index).toBe(1);
  });
});

describe('purity & additivity (independent oracles, Decisions P-3/P-9)', () => {
  it('does not mutate prevState and returns a new object', () => {
    const before = state(homeStack(['index'])); // @0
    const snapshot = clone(before);
    const after = reduce(before, {
      ops: [{ type: 'insert', target: 'home.stack', route: { key: 'details#1', name: 'details' } }],
      source: 'js',
    });
    expect(before).toEqual(snapshot); // untouched
    expect(after).not.toBe(before);
  });

  it('back-to-back actions compose — op B applies to the result of op A, both land (P-9)', () => {
    // Additivity is a pure-reducer property (NOT a useReducer/transition property — see P-9).
    const before = state(homeStack(['index'])); // @0
    const a = reduce(before, {
      ops: resolve({ type: 'push', route: { key: 'a#1', name: 'a' } }, before.root, 'stack'),
      source: 'js',
    });
    const b = reduce(a, {
      ops: resolve({ type: 'push', route: { key: 'b#2', name: 'b' } }, a.root, 'stack'),
      source: 'js',
    });
    expect(b.root.routes.map((r) => r.name)).toEqual(['index', 'a', 'b']);
    expect(b.root.index).toBe(2);
  });
});

describe('end-to-end through the resolver (compose both seams)', () => {
  it('stack popTo resolves and reduces to the target depth', () => {
    const before = state(homeStack(['index', 'list', 'details', 'more'])); // @3
    const after = reduce(before, {
      ops: resolve({ type: 'popTo', routeKey: 'list#k' }, before.root, 'stack'),
      source: 'js',
    });
    expect(after.root).toEqual({
      key: 'home.stack',
      index: 1,
      routes: [
        { key: 'index#k', name: 'index' },
        { key: 'list#k', name: 'list' },
      ],
    });
  });

  it('scenario 5 — stack back pops to [index, list] @1', () => {
    const before = state(homeStack(['index', 'list', 'details'])); // @2
    const after = reduce(before, {
      ops: resolve({ type: 'goBack' }, before.root, 'stack'),
      source: 'js',
    });
    expect(after.root).toEqual({
      key: 'home.stack',
      index: 1,
      routes: [
        { key: 'index#k', name: 'index' },
        { key: 'list#k', name: 'list' },
      ],
    });
  });
});

describe('homogeneous shape (P-10)', () => {
  it('focusing one column of a multi-visible node leaves the other column stack intact', () => {
    // Split-view-style node: several columns shown at once; each keeps its own independent stack.
    const before = state({
      key: 'split',
      index: 0,
      routes: [
        { key: 'list#0', name: 'list', child: homeStack(['index']) }, // depth 1
        { key: 'detail#1', name: 'detail', child: homeStack(['index', 'a']) }, // depth 2
      ],
    });
    const after = reduce(before, {
      ops: [{ type: 'setIndex', target: 'split', index: 1 }],
      source: 'js',
    });
    expect(after.root.index).toBe(1);
    expect(after.root.routes[0].child?.routes).toHaveLength(1); // unfocused column not truncated
    expect(after.root.routes[1].child?.routes).toHaveLength(2);
  });
});
