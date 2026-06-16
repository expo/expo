import { resolveBack } from '../back';
import { reduce } from '../reducer';
import { ROOT_NAME } from '../tree';
import type { BehaviorLookup, GlobalNavState, NavNode } from '../types';

// Phase 3a — render-free back-bubbling resolution (RFC scenario 5/6 + fall-through, C12, P-8).
//
// Back bubbles from the focused leaf upward: a node whose behavior can handle it emits its back op,
// else it bubbles, else the app exits. Focus-order is an injected input, not owned here (P-8).

const stack = (names: string[], index = names.length - 1): NavNode => ({
  key: 'home.stack',
  index,
  routes: names.map((name) => ({ key: `${name}#k`, name })),
});

// A tabs root whose focused tab hosts the given stack.
const rootWith = (tabNames: string[], focusedTab: number, childStack: NavNode): GlobalNavState => ({
  root: {
    key: 'root',
    index: focusedTab,
    routes: tabNames.map((name, i) => ({
      key: `${name}#${i}`,
      name,
      child:
        i === focusedTab
          ? childStack
          : { key: `${name}.stack`, index: 0, routes: [{ key: `${name}.index`, name: 'index' }] },
    })),
  },
});

const lookup: BehaviorLookup = { [ROOT_NAME]: 'tabs', home: 'stack', search: 'stack' };

describe('resolveBack', () => {
  it('scenario 5 — the focused stack handles back (remove + index--)', () => {
    const state = rootWith(['home', 'search'], 0, stack(['index', 'list', 'details'])); // home focused @2
    const result = resolveBack(state, lookup);
    expect('ops' in result).toBe(true);
    const after = reduce(state, { ops: (result as { ops: [] }).ops, source: 'js' });
    const homeStack = after.root.routes[0].child!;
    expect(homeStack.routes.map((r) => r.name)).toEqual(['index', 'list']);
    expect(homeStack.index).toBe(1);
  });

  it('scenario 6 — back bubbles past a root-level stack to tabs, which refocuses via focus-order', () => {
    const state = rootWith(['home', 'search'], 1, stack(['index'])); // search focused, its stack @0
    const result = resolveBack(state, lookup, ['home', 'search']);
    expect(result).toEqual({ ops: [{ type: 'setIndex', target: 'root', index: 0 }] });
    const after = reduce(state, { ops: (result as { ops: [] }).ops, source: 'js' });
    expect(after.root.index).toBe(0); // refocused home
    expect(after.root.routes.length).toBe(2); // no route removed
  });

  it('the innermost handler wins — an inner stack handles before the outer tabs', () => {
    const state = rootWith(['home', 'search'], 1, stack(['index', 'results'])); // search stack @1
    const result = resolveBack(state, lookup, ['home', 'search']);
    // The inner stack can pop, so tabs is never consulted.
    expect(result).toEqual({
      ops: [
        { type: 'remove', target: 'home.stack', routeKeys: ['results#k'] },
        { type: 'setIndex', target: 'home.stack', index: 0 },
      ],
    });
  });

  it('bubbles through a stuck inner navigator to a MIDDLE stack that can pop (3 levels)', () => {
    // root tabs(@0) → middle home.stack [a, b]@1 → leaf tabs [x]@0 (cannot refocus).
    const leafTabs: NavNode = { key: 'leaf', index: 0, routes: [{ key: 'x#k', name: 'x' }] };
    const midStack: NavNode = {
      key: 'home.stack',
      index: 1,
      routes: [
        { key: 'a#k', name: 'a' },
        { key: 'b#k', name: 'b', child: leafTabs },
      ],
    };
    const state: GlobalNavState = {
      root: { key: 'root', index: 0, routes: [{ key: 'home#0', name: 'home', child: midStack }] },
    };
    // leaf tabs (keyed by route `b`) can't refocus with ['x']; bubbles to the middle home stack.
    const result = resolveBack(state, { [ROOT_NAME]: 'tabs', home: 'stack', b: 'tabs' }, ['x']);
    expect(result).toEqual({
      ops: [
        { type: 'remove', target: 'home.stack', routeKeys: ['b#k'] },
        { type: 'setIndex', target: 'home.stack', index: 0 },
      ],
    });
  });

  describe('falls through to app-exit', () => {
    const state = rootWith(['home', 'search'], 1, stack(['index'])); // search focused, its stack at root

    it('when there is no focus-order at all', () => {
      expect(resolveBack(state, lookup)).toEqual({ exit: true });
    });

    it('when the focused tab is FIRST in a full focus-order (nothing before it)', () => {
      const onHome = rootWith(['home', 'search'], 0, stack(['index']));
      expect(resolveBack(onHome, lookup, ['home', 'search'])).toEqual({ exit: true });
    });

    it('when focus-order names a previous tab that is absent from the node', () => {
      expect(resolveBack(state, lookup, ['ghost', 'search'])).toEqual({ exit: true });
    });
  });

  it('bubbles past a node whose behavior is unknown (custom navigator)', () => {
    const state = rootWith(['home', 'search'], 0, stack(['index'])); // home stack at root, cannot pop
    // `home` not in the lookup → unknown behavior is skipped; tabs has no focus-order → exit.
    expect(resolveBack(state, { [ROOT_NAME]: 'tabs' })).toEqual({ exit: true });
  });
});
