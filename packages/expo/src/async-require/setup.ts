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
