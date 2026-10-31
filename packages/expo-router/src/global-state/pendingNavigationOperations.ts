/** Tracks commands until their reducer result commits, including external React transitions. */
export function createPendingNavigationOperations() {
  const pending = new Map<number, boolean>();
  const listeners = new Set<() => void>();
  let snapshot: Readonly<{ pending: boolean; normalPending: boolean }> = Object.freeze({
    pending: false,
    normalPending: false,
  });
  const publish = () => {
    const normalPending = [...pending.values()].some((guarded) => !guarded);
    if (snapshot.pending === pending.size > 0 && snapshot.normalPending === normalPending) return;
    snapshot = Object.freeze({ pending: pending.size > 0, normalPending });
    for (const listener of listeners) listener();
  };
  return {
    hasOtherThan(id: number) {
      return pending.size > (pending.has(id) ? 1 : 0);
    },
    enqueue(id: number, guarded: boolean) {
      pending.set(id, guarded);
      publish();
    },
    settle(ids: readonly number[]) {
      for (const id of ids) pending.delete(id);
      publish();
    },
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
