/**
 * Requires a module if it's available, so the app degrades gracefully when
 * `native-component-list` isn't bundled (e.g. minimal CI builds).
 */
export function optionalRequire<T = any>(requirer: () => T): T | null {
  try {
    return requirer();
  } catch {
    return null;
  }
}
