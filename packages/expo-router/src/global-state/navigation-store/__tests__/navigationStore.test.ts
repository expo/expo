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

  it('dispatches a REPLACE_ROOT immediately on a non-batched stage', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const next = makeTree(1);
    store.stageRootState(next);

    expect(dispatched).toEqual([{ type: 'REPLACE_ROOT', tree: next }]);
  });

  it('coalesces N synchronous root writes in a batch into exactly one REPLACE_ROOT', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const last = makeTree(3);
    store.batch(() => {
      store.stageRootState(makeTree(1));
      store.stageRootState(makeTree(2));
      store.stageRootState(last);
      expect(dispatched).toHaveLength(0); // suppressed until the batch ends
      expect(store.getState()).toBe(last); // but the live tree reads-its-own-writes
    });

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({ type: 'REPLACE_ROOT', tree: last });
  });

  it('nested batches coalesce: only the outermost flush dispatches once', () => {
    // The imperative drain wraps routingQueue.run in batch, and each navigation.dispatch inside it
    // also batches its cascade. Nested batches must collapse to a single dispatch.
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const last = makeTree(9);
    store.batch(() => {
      store.batch(() => store.stageRootState(makeTree(1)));
      expect(dispatched).toHaveLength(0); // inner batch did not flush
      store.batch(() => store.stageRootState(last));
      expect(dispatched).toHaveLength(0);
    });

    expect(dispatched).toEqual([{ type: 'REPLACE_ROOT', tree: last }]);
  });

  it('flush is a no-op when nothing is pending', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    store.flush();
    expect(dispatched).toHaveLength(0);
  });

  it('commitSlice composes into the live tree and dispatches one COMMIT_SLICES', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const tabs1 = slice('tabs', 1);
    store.commitSlice('tabs', tabs1);
    // Live tree updated synchronously so a sibling commit in the same batch reads it.
    expect(store.getState().routes[0].state).toBe(tabs1);

    expect(dispatched).toHaveLength(1);
    expect(dispatched[0]).toEqual({
      type: 'COMMIT_SLICES',
      slices: [{ key: 'tabs', slice: tabs1 }],
    });
  });

  it('a staged root in a batch takes precedence over pending slices and dev-warns', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const dispatched: NavAction[] = [];
      const store = createNavigationStore(makeTree(0));
      store.setDispatch((action) => dispatched.push(action));

      const root = makeTree(5);
      store.batch(() => {
        store.commitSlice('tabs', slice('tabs', 1));
        store.stageRootState(root);
      });

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
    expect(() => store.stageRootState(a)).not.toThrow();
    // The live tree still holds the result, ready to seed the reducer when the provider mounts.
    expect(store.getState()).toBe(a);
  });

  it('setDispatch(null) (unmount) makes a subsequent write a no-op without throwing', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));
    store.setDispatch(null);

    expect(() => store.stageRootState(makeTree(1))).not.toThrow();
    expect(dispatched).toHaveLength(0);
  });

  it('does not commit (or dispatch) a slice for an unknown key', () => {
    const dispatched: NavAction[] = [];
    const store = createNavigationStore(makeTree(0));
    store.setDispatch((action) => dispatched.push(action));

    const before = store.getState();
    store.commitSlice('unknown-key', slice('unknown-key'));
    expect(store.getState()).toBe(before); // live tree unchanged
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

    expect(dispatched).toHaveLength(1);
    const replayed = navReducer(initial, dispatched[0]);
    expect(replayed).toEqual(live);
  });
});
