import type { NavNode } from '../../types';
import { projectToStackState } from '../projectToStackState';

// R-Phase B — the NavNode → StackNavigationState projection (Decisions R-2).

const node: NavNode = {
  key: 'home.stack',
  index: 1,
  routes: [
    { key: 'index#0', name: 'index' },
    {
      key: 'details#1',
      name: 'details',
      params: { id: '42' },
      child: { key: 'c', index: 0, routes: [] },
    },
  ],
};

describe('projectToStackState', () => {
  it('carries index and route key/name/params through unchanged (key identity, P-13)', () => {
    const state = projectToStackState(node);
    expect(state.index).toBe(1);
    expect(state.routes.map((r) => r.key)).toEqual(['index#0', 'details#1']); // keys preserved
    expect(state.routes.map((r) => r.name)).toEqual(['index', 'details']);
    expect(state.routes[1].params).toEqual({ id: '42' });
  });

  it('produces a well-formed inert stack state (type/stale/key/routeNames, empty preload)', () => {
    const state = projectToStackState(node);
    expect(state.type).toBe('stack');
    expect(state.stale).toBe(false);
    expect(state.key).toBe('home.stack');
    expect(state.routeNames).toEqual(['index', 'details']);
    expect(state.preloadedRoutes).toEqual([]);
  });

  it('does not leak the NavNode `child` into the projected route (the view uses descriptors)', () => {
    const state = projectToStackState(node);
    expect(state.routes[1]).not.toHaveProperty('child');
    expect(state.routes[1]).not.toHaveProperty('state');
  });

  it('leaves params undefined when a route has none (not defaulted to {})', () => {
    expect(projectToStackState(node).routes[0].params).toBeUndefined();
  });

  it('handles an empty node (index 0, no routes)', () => {
    const empty = projectToStackState({ key: 'empty', index: 0, routes: [] });
    expect(empty.routes).toEqual([]);
    expect(empty.index).toBe(0);
    expect(empty.routeNames).toEqual([]);
  });
});
