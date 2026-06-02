import { navReducer, type NavAction } from '../navReducer';
import { createNavigationStore } from '../navigationStore';
import type { NavigationTree } from '../types';

function makeTree(index = 0): NavigationTree {
  return {
    key: 'root',
    index,
    type: 'stack',
    routeNames: ['(tabs)'],
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
            { key: 't2', name: 'settings' },
          ],
        },
      },
    ],
  } as NavigationTree;
}

const slice = (key: string, index = 0): NavigationTree =>
  ({ key, index, type: 'tab', routeNames: [], stale: false, routes: [] }) as NavigationTree;

describe('createNavigationStore', () => {
  it('getState reflects every synchronous write before any flush (read-your-writes)', () => {
    const store = createNavigationStore(makeTree(0));
    const a = makeTree(1);
    const b = makeTree(2);

    store.stageRootState(a);
    expect(store.getState()).toBe(a);
    store.stageRootState(b);
    expect(store.getState()).toBe(b);
  });

  it('coalesces N synchronous root writes into exactly one REPLACE_ROOT dispatch', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    store.stageRootState(makeTree(1));
    store.stageRootState(makeTree(2));
    const last = makeTree(3);
    store.stageRootState(last);
    store.flush();

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({ type: 'REPLACE_ROOT', tree: last });
  });

  it('flush is a no-op when nothing is pending', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    store.flush();
    expect(dispatched).toHaveLength(0);
  });

  it('commitSlice composes into the live tree synchronously and flushes one COMMIT_SLICES', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const tabs1 = slice('tabs', 1);
    store.commitSlice('tabs', tabs1);
    // Live tree updated synchronously so a sibling commit in the same task reads it.
    expect(store.getState().routes[0].state).toBe(tabs1);

    store.flush();
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({
      type: 'COMMIT_SLICES',
      slices: [{ key: 'tabs', slice: tabs1 }],
    });
  });

  it('a staged root takes precedence over pending slices and dev-warns about the drop', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const dispatched: NavAction[] = [];
      const store = createNavigationStore(makeTree(0));
      store.setDispatch((action) => dispatched.push(action));

      store.commitSlice('tabs', slice('tabs', 1));
      const root = makeTree(5);
      store.stageRootState(root);
      store.flush();

      expect(dispatched).toHaveLength(1);
      expect(dispatched[0]).toEqual({ type: 'REPLACE_ROOT', tree: root });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('superseded'));
    } finally {
      warn.mockRestore();
    }
  });

  it('drops the dispatch but keeps the live tree when no reducer is wired (pre-mount)', () => {
    const store = createNavigationStore(makeTree(0));
    const a = makeTree(7);
    store.stageRootState(a);
    expect(() => store.flush()).not.toThrow();
    // The live tree still holds the result, ready to seed the reducer when the provider mounts.
    expect(store.getState()).toBe(a);
  });

  it('clears pending work after a flush so a subsequent empty flush dispatches nothing', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    store.stageRootState(makeTree(1));
    store.flush();
    store.flush();

    expect(dispatched).toHaveLength(1);
  });

  it('setDispatch(null) (unmount) drops pending work without throwing', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    store.stageRootState(makeTree(1));
    store.setDispatch(null);
    expect(() => store.flush()).not.toThrow();
    expect(dispatched).toHaveLength(0);
  });

  it('does not commit (or dispatch) a slice for an unknown key', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const before = store.getState();
    store.commitSlice('unknown-key', slice('unknown-key'));
    expect(store.getState()).toBe(before); // live tree unchanged
    store.flush();
    expect(dispatched).toHaveLength(0); // nothing buffered, nothing dispatched
  });

  it('the dispatched COMMIT_SLICES, replayed through navReducer, matches the live tree', () => {
    // This is the atomicity contract C2 depends on: the buffered live tree and the published
    // reducer state must agree after one flush.
    const dispatched: NavAction[] = [];
    const initial = makeTree(0);
    const store = createNavigationStore(initial);
    store.setDispatch((action) => dispatched.push(action));

    store.commitSlice('tabs', slice('tabs', 1));
    const live = store.getState();
    store.flush();

    expect(dispatched).toHaveLength(1);
    const replayed = navReducer(initial, dispatched[0]);
    expect(replayed).toEqual(live);
  });
});
