import type { ReactNavigationState } from './types';

// Indirection so `BaseNavigationContainer` (in `react-navigation/core`) can read the compiled seed
// from the store without a static import cycle. A direct `import { store }` there forms a cycle:
// core → global-state/store → getRouteInfoFromState → getPathFromState-forks → react-navigation/native → core,
// which crashes at module-eval. This module has no runtime imports (the type import is erased) and
// reads the store lazily; `getSeedState` is only called from `useSyncState`'s one-shot initializer,
// long after every module has loaded, so the lazy `require` is safe and runs once.
export function getSeedState(): ReactNavigationState | undefined {
  return (require('./store') as typeof import('./store')).store.state;
}
