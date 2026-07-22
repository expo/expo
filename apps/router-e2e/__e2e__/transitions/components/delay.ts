// Controllable delays keyed by name, shared between the index (the "commit the held navigation"
// button) and the suspending screens. A suspending screen `use()`s a promise that only resolves
// when `resolveDelay()` is called (a button on the index), so the pending window can be held open
// on the simulator for as long as needed — including "never", to exercise the starvation case
// (risk 2). Keying by name lets two suspending screens be pending at once (e.g. a tab and a modal
// both pushing a slow screen) without one's resolve settling the other.

const deferreds = new Map<string, { promise: Promise<void>; resolve: () => void }>();

/** Returns a promise that suspends until `resolveDelay(key)` is called. One deferred per key. */
export function delayPromise(key: string = 'default'): Promise<void> {
  let entry = deferreds.get(key);
  if (!entry) {
    let resolve!: () => void;
    const promise = new Promise<void>((res) => {
      resolve = res;
    });
    entry = { promise, resolve };
    deferreds.set(key, entry);
  }
  return entry.promise;
}

/** Resolve outstanding delays (commit pending navigations). Omit `key` to resolve all. */
export function resolveDelay(key?: string) {
  if (key) {
    deferreds.get(key)?.resolve();
    deferreds.delete(key);
    return;
  }
  for (const entry of deferreds.values()) {
    entry.resolve();
  }
  deferreds.clear();
}
