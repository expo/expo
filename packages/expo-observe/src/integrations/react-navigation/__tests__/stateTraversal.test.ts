import { collectMountedKeys, findFocusedLeaf } from '../stateTraversal';
import type { NavigationStateLike } from '../types';

function stackState(
  routes: { key: string; name: string; state?: NavigationStateLike }[],
  index: number | undefined
): NavigationStateLike {
  return {
    type: 'stack',
    index,
    routes,
    key: 'test',
    routeNames: [],
    stale: false,
  } as NavigationStateLike;
}

function tabState(
  routes: { key: string; name: string; state?: NavigationStateLike }[],
  index = 0
): NavigationStateLike {
  return {
    type: 'tab',
    index,
    routes,
    key: 'test',
    routeNames: [],
    stale: false,
  } as NavigationStateLike;
}

function drawerState(
  routes: { key: string; name: string; state?: NavigationStateLike }[],
  index = 0
): NavigationStateLike {
  return {
    type: 'drawer',
    index,
    routes,
    key: 'test',
    routeNames: [],
    stale: false,
  } as NavigationStateLike;
}

describe('findFocusedLeaf', () => {
  it('returns null when index points past the routes array', () => {
    const state = stackState([{ key: 'a', name: 'A' }], 5);
    expect(findFocusedLeaf(state)).toBeNull();
  });

  it('returns first router when index is undefined the routes array', () => {
    const state = stackState([{ key: 'a', name: 'A' }], undefined);
    expect(findFocusedLeaf(state)).toEqual({
      route: { key: 'a', name: 'A' },
      key: 'a',
    });
  });

  it('returns the focused route in a flat stack', () => {
    const state = stackState(
      [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
      ],
      1
    );
    expect(findFocusedLeaf(state)).toEqual({
      route: state.routes[1],
      key: 'b',
    });
  });

  it('descends into a nested stack to find the leaf', () => {
    const inner = stackState([{ key: 'b', name: 'B' }], 0);
    const outer = stackState([{ key: 'a', name: 'A', state: inner }], 0);
    expect(findFocusedLeaf(outer)).toEqual({ route: inner.routes[0], key: 'b' });
  });

  it('descends through tabs to find the focused screen', () => {
    const tabs = tabState(
      [
        { key: 't1', name: 'Home' },
        { key: 't2', name: 'Settings' },
      ],
      1
    );
    const outer = stackState([{ key: 'root', name: 'Root', state: tabs }], 0);
    expect(findFocusedLeaf(outer)).toEqual({ route: tabs.routes[1], key: 't2' });
  });

  it('stops when the focused route has no nested state', () => {
    const state = stackState([{ key: 'a', name: 'A' }], 0);
    expect(findFocusedLeaf(state)).toEqual({ route: state.routes[0], key: 'a' });
  });
});

describe('collectMountedKeys', () => {
  it('collects every key in a flat stack', () => {
    const state = stackState(
      [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
        { key: 'c', name: 'C' },
      ],
      2
    );
    expect([...collectMountedKeys(state).keys()]).toEqual(['a', 'b', 'c']);
  });

  it('recurses into nested stack subtrees', () => {
    const inner = stackState([{ key: 'inner', name: 'Inner' }], 0);
    const outer = stackState([{ key: 'a', name: 'A', state: inner }], 0);
    expect([...collectMountedKeys(outer).keys()].sort()).toEqual(['a', 'inner']);
  });

  it('treats drawer subtrees as mounted (drawer is not a tab)', () => {
    const drawer = drawerState([
      { key: 'd1', name: 'D1' },
      { key: 'd2', name: 'D2' },
    ]);
    const outer = stackState([{ key: 'root', name: 'Root', state: drawer }], 0);
    expect([...collectMountedKeys(outer).keys()].sort()).toEqual(['d1', 'd2', 'root']);
  });

  it('includes the focused tab and its subtree, but skips sibling tabs', () => {
    const innerStack = stackState(
      [
        { key: 'tabStack1', name: 'TabScreen1' },
        { key: 'tabStack2', name: 'TabScreen2' },
      ],
      0
    );
    const tabs = tabState(
      [
        { key: 't1', name: 'Home', state: innerStack },
        { key: 't2', name: 'Settings' },
      ],
      0
    );
    const outer = stackState([{ key: 'root', name: 'Root', state: tabs }], 0);
    expect([...collectMountedKeys(outer).keys()].sort()).toEqual([
      'root',
      't1',
      'tabStack1',
      'tabStack2',
    ]);
  });

  it('returns only the focused tab when the root navigator is a tab navigator', () => {
    const tabs = tabState(
      [
        { key: 't1', name: 'Home' },
        { key: 't2', name: 'Settings' },
      ],
      0
    );
    expect([...collectMountedKeys(tabs).keys()]).toEqual(['t1']);
  });

  it('maps each key to its route object', () => {
    const state = stackState(
      [
        { key: 'a', name: 'A' },
        { key: 'b', name: 'B' },
      ],
      0
    );
    const map = collectMountedKeys(state);
    expect(map.get('a')).toBe(state.routes[0]);
    expect(map.get('b')).toBe(state.routes[1]);
  });
});
