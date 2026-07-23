import type { ReactNavigationState } from './types';

// Indirection so `BaseNavigationContainer` (in `react-navigation/core`) can read the compiled seed
// from the store. This module has no runtime imports (the type import is erased) and reads the store
// lazily; `getSeedState` is only called from the container's `React.useReducer` one-shot initializer,
// long after every module has loaded, so the lazy `require` is safe and runs once.
//
// The container also imports `store`/`rootReducer`/`RouteInfoProvider` statically now; that stays
// cycle-free only because `fork/getPathFromState-forks.ts` imports `validatePathConfig` from the
// LEAF module rather than the `react-navigation/native` barrel (which re-exports `../core`). If that
// edge is ever normalized back to the barrel, the module-eval cycle
// core → BaseNavigationContainer → store → getRouteInfoFromState → getPathFromState-forks → native → core
// returns — invisible to jest, but broken under Metro. See the comment at that import.
export function getSeedState(): ReactNavigationState | undefined {
  return (require('./store') as typeof import('./store')).store.state;
}
