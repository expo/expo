/**
 * Defines a small polyfill for process.nextTick. Eventually we'd like to replace this polyfill with
 * a native implementation with the correct timing semantics.
 */

declare const process: Record<string, any>;

if (!process.nextTick) {
  process.nextTick = (callback, ...args) => {
    setTimeout(() => callback(...args), 0);
  };
}
