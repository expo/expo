type Listener = (data?: any) => void;

const listeners: Record<string, Set<Listener>> = {};

export function emit(event: string, data?: any): void {
  listeners[event]?.forEach((fn) => fn(data));
}

export function addListener(event: string, listener: Listener): { remove: () => void } {
  if (!listeners[event]) {
    listeners[event] = new Set();
  }
  listeners[event].add(listener);
  return {
    remove() {
      listeners[event]?.delete(listener);
    },
  };
}
