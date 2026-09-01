const channel = 'main';
const updateId = '0000-1111';
const commitTime = new Date('2023-03-26T04:58:02.560Z');
const checkForUpdateAsync = jest.fn();
const fetchUpdateAsync = jest.fn();
const reload = jest.fn();

// The real module is a singleton stored on the global object, so its listeners survive a
// re-evaluation of the module graph. Keep the registry on the global here too, otherwise
// `jest.resetModules()` would hand out a fresh set of listeners and hide that behavior.
const listeners: Map<string, Set<Function>> = ((globalThis as any).__expoUpdatesMockListeners ??=
  new Map());

const addListener = jest.fn((eventName: string, listener: Function) => {
  if (!listeners.has(eventName)) {
    listeners.set(eventName, new Set());
  }
  listeners.get(eventName)?.add(listener);
  return { remove: () => listeners.get(eventName)?.delete(listener) };
});

const removeAllListeners = jest.fn((eventName: string) => {
  listeners.get(eventName)?.clear();
});

const listenerCount = jest.fn((eventName: string) => listeners.get(eventName)?.size ?? 0);

export default {
  channel,
  updateId,
  commitTime,
  checkForUpdateAsync,
  fetchUpdateAsync,
  reload,
  addListener,
  removeAllListeners,
  listenerCount,
};
