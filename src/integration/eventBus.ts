type Listener = (data: unknown) => void;

const listeners: Record<string, Listener[]> = {};

/**
 * Simple publish/subscribe event bus for decoupled communication between
 * the integration layer and UI components.
 */
export const EventBus = {
  subscribe(event: string, listener: Listener): () => void {
    if (!listeners[event]) {
      listeners[event] = [];
    }
    listeners[event].push(listener);
    return () => {
      listeners[event] = listeners[event].filter((l) => l !== listener);
    };
  },

  emit(event: string, data: unknown): void {
    (listeners[event] ?? []).forEach((l) => l(data));
  },
};
