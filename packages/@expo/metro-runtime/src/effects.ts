// Only during development.
if (process.env.NODE_ENV !== 'production') {
  if (
    // Disable for SSR
    typeof window !== 'undefined'
  ) {
    require('./setupFastRefresh');
    require('./setupHMR');
    require('./messageSocket');
  }
}
