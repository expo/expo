// R-Phase B — a minimal per-navigator event bus for the `navigation` shim's addListener/emit
// (focus/blur/transitionEnd). Navigator-local, ephemeral.

type Listener = (event: { type: string; data?: unknown; target?: string }) => void;

export type EventEmitter = {
  /** Subscribe; returns an unsubscribe (what react-navigation's `addListener` contract returns). */
  on: (type: string, listener: (...args: unknown[]) => void) => () => void;
  emit: (event: { type: string; data?: unknown; target?: string }) => void;
};

export function createEmitter(): EventEmitter {
  const listeners = new Map<string, Set<Listener>>();
  return {
    on(type, listener) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener as Listener);
      listeners.set(type, set);
      return () => set.delete(listener as Listener);
    },
    emit(event) {
      listeners.get(event.type)?.forEach((listener) => listener(event));
    },
  };
}
