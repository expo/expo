// Only during development.
if (process.env.NODE_ENV !== 'production') {
  if (
    // Disable for SSR
    typeof globalThis.expo !== 'undefined'
  ) {
    require('./messageSocket');
  }
}
