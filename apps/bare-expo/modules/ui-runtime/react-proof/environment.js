// Runs BEFORE React/Scheduler are loaded. This is a deliberately small host
// environment, not the React Native runtime or a complete JS event loop.
(() => {
  let nextID = 1;
  const callbacks = new Map();
  globalThis.performance = { now: () => __uiNow() };
  globalThis.setImmediate = (callback, ...args) => {
    if (typeof callback !== 'function') throw new TypeError('Expected a callback');
    const id = nextID++;
    callbacks.set(id, () => callback(...args));
    try {
      __postUITask(id);
    } catch (error) {
      callbacks.delete(id);
      throw error;
    }
    return id;
  };
  globalThis.clearImmediate = (id) => callbacks.delete(id);
  globalThis.__runUITask = (id) => {
    const callback = callbacks.get(id);
    callbacks.delete(id);
    callback?.();
  };
})();
