// NOTE(@kitten): This module is used in Node contexts, e.g. via jest-expo
declare const window: typeof globalThis | void;

// Only during development.
if (
  __DEV__ &&
  // Disable for SSR
  typeof window !== 'undefined'
) {
  require('./setupFastRefresh');
  require('./setupHMR');
  require('./messageSocket');
}
