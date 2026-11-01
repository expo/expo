import type { NavigationState } from '../react-navigation/routers';

export type NavigationActionResult = {
  status: 'handled' | 'prevented' | 'unhandled' | 'stale' | 'noop' | 'cancelled';
  state: NavigationState;
};

export type NavigationActionTransaction = {
  id: number;
  token: object;
  scope?: object;
  expectedState: NavigationState;
  blockedAtEnqueue?: boolean;
};

export type NavigationTransactionCancellations = Readonly<{ has(token: object): boolean }>;

function cancellationSnapshot(tokens: object[]): NavigationTransactionCancellations {
  const cancelled = new WeakSet(tokens);
  // Do not expose WeakSet.add/delete: each reducer render sees an immutable snapshot.
  return Object.freeze({ has: (token: object) => cancelled.has(token) });
}

/** Callbacks live outside reducer state. Only explicit cancellation invalidates a replay. */
export function createNavigationActionResultRegistry() {
  const scope = Object.freeze({});
  let nextId = 0;
  let cancelledRefs: WeakRef<object>[] = [];
  let snapshot = cancellationSnapshot([]);
  const callbacks = new Map<number, (result: NavigationActionResult) => void>();
  const listeners = new Set<() => void>();
  const cancel = (token: object) => {
    const tokens: object[] = [];
    cancelledRefs = cancelledRefs.filter((ref) => {
      const value = ref.deref();
      if (value) tokens.push(value);
      return value !== undefined;
    });
    cancelledRefs.push(new WeakRef(token));
    tokens.push(token);
    snapshot = cancellationSnapshot(tokens);
    for (const listener of listeners) listener();
  };
  return {
    scope,
    register(callback: (result: NavigationActionResult) => void) {
      const id = ++nextId;
      const token = Object.freeze({ id });
      let removed = false;
      let settled = false;
      callbacks.set(id, (result) => {
        settled = true;
        callback(result);
      });
      return {
        id,
        token,
        remove() {
          if (removed || settled) return;
          removed = true;
          callbacks.delete(id);
          cancel(token);
        },
      };
    },
    settle(id: number, result: NavigationActionResult) {
      const callback = callbacks.get(id);
      callbacks.delete(id);
      // Successful settlement must not look like cancellation when React rebases
      // a lower-priority update. Cancelled tokens live only as long as queued work.
      callback?.(result);
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    clear() {
      callbacks.clear();
    },
  };
}
