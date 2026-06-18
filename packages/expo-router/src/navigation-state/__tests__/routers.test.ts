import { stackRouter, tabsRouter } from '../routers';
import type { NavNode } from '../types';

// Per-navigator routers (Decisions R-13). `getStateForAction(node, action)` returns the next local
// subtree, or null when it doesn't change / doesn't handle the action.

const stack = (names: string[], index = names.length - 1): NavNode => ({
  key: 'n.stack',
  index,
  routes: names.map((name) => ({ key: `${name}#k`, name })),
});

describe('stackRouter', () => {
  it('navigate pushes an absent route and focuses it', () => {
    const next = stackRouter.getStateForAction(stack(['index']), {
      type: 'navigate',
      target: { key: 'details#1', name: 'details', params: { id: '1' } },
    })!;
    expect(next.routes.map((r) => r.name)).toEqual(['index', 'details']);
    expect(next.index).toBe(1);
    expect(next.routes[1]!.params).toEqual({ id: '1' });
  });

  it('navigate to an existing route pops back to it (truncates above)', () => {
    const next = stackRouter.getStateForAction(stack(['index', 'list', 'details']), {
      type: 'navigate',
      target: { name: 'list' },
    })!;
    expect(next.routes.map((r) => r.name)).toEqual(['index', 'list']);
    expect(next.index).toBe(1);
  });

  it('navigate to the current top is a no-op (null)', () => {
    expect(
      stackRouter.getStateForAction(stack(['index', 'list']), {
        type: 'navigate',
        target: { name: 'list' },
      })
    ).toBeNull();
  });

  it('goBack pops the top; null at the anchor', () => {
    expect(stackRouter.getStateForAction(stack(['index', 'list']), { type: 'goBack' })).toEqual({
      key: 'n.stack',
      index: 0,
      routes: [{ key: 'index#k', name: 'index' }],
    });
    expect(stackRouter.getStateForAction(stack(['index']), { type: 'goBack' })).toBeNull();
  });

  it('goBackTo truncates above the target; null if absent or not below focus', () => {
    expect(
      stackRouter.getStateForAction(stack(['index', 'list', 'details']), {
        type: 'goBackTo',
        routeKey: 'index#k',
      })
    ).toEqual({ key: 'n.stack', index: 0, routes: [{ key: 'index#k', name: 'index' }] });
    expect(
      stackRouter.getStateForAction(stack(['index', 'list']), {
        type: 'goBackTo',
        routeKey: 'ghost',
      })
    ).toBeNull();
  });

  it('replace swaps the focused route in place', () => {
    const next = stackRouter.getStateForAction(stack(['index', 'list']), {
      type: 'replace',
      target: { key: 'new#1', name: 'new' },
    })!;
    expect(next.routes.map((r) => r.name)).toEqual(['index', 'new']);
    expect(next.index).toBe(1);
  });

  it('reset returns the provided state; preload is null (navigator-local)', () => {
    const fresh = stack(['a']);
    expect(stackRouter.getStateForAction(stack(['x']), { type: 'reset', state: fresh })).toBe(
      fresh
    );
    expect(
      stackRouter.getStateForAction(stack(['x']), { type: 'preload', target: { name: 'y' } })
    ).toBeNull();
  });
});

describe('tabsRouter', () => {
  const tabs = (names: string[], index = 0): NavNode => ({
    key: 'root',
    index,
    routes: names.map((name) => ({ key: `${name}#k`, name })),
  });

  it('navigate to an existing tab sets index (no route removed)', () => {
    expect(
      tabsRouter.getStateForAction(tabs(['home', 'search']), {
        type: 'navigate',
        target: { name: 'search' },
      })
    ).toEqual({
      key: 'root',
      index: 1,
      routes: [
        { key: 'home#k', name: 'home' },
        { key: 'search#k', name: 'search' },
      ],
    });
  });

  it('navigate to the focused tab is a no-op (null)', () => {
    expect(
      tabsRouter.getStateForAction(tabs(['home', 'search'], 1), {
        type: 'navigate',
        target: { name: 'search' },
      })
    ).toBeNull();
  });

  it('THESIS (P-5): navigate to an ABSENT tab promotes it, grafting the hydrated child', () => {
    const child: NavNode = {
      key: 'search.stack',
      index: 0,
      routes: [{ key: 'index#0', name: 'index' }],
    };
    const next = tabsRouter.getStateForAction(tabs(['home']), {
      type: 'navigate',
      target: { key: 'search#1', name: 'search', child },
    })!;
    expect(next.routes.map((r) => r.name)).toEqual(['home', 'search']);
    expect(next.index).toBe(1);
    expect(next.routes[1]!.child).toBe(child); // grafted as-is
  });

  it('goBack bubbles (null); goBackTo refocuses a tab without removing routes', () => {
    expect(
      tabsRouter.getStateForAction(tabs(['home', 'search'], 1), { type: 'goBack' })
    ).toBeNull();
    expect(
      tabsRouter.getStateForAction(tabs(['home', 'search'], 1), {
        type: 'goBackTo',
        routeKey: 'home#k',
      })
    ).toEqual({
      key: 'root',
      index: 0,
      routes: [
        { key: 'home#k', name: 'home' },
        { key: 'search#k', name: 'search' },
      ],
    });
  });
});

describe('the same action differs by router — the C12 distinction', () => {
  it('goBack pops a stack but bubbles a tabs node', () => {
    const node = stack(['a', 'b']);
    expect(stackRouter.getStateForAction(node, { type: 'goBack' })).not.toBeNull();
    expect(tabsRouter.getStateForAction(node, { type: 'goBack' })).toBeNull();
  });
});
