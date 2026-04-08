// Re-export shim — preserves all existing import paths.
// TODO: Refactor consumers to import directly from the new modules, then delete this file.

export { store } from './store';
export type { RouterStore } from './store';
export { useStore } from './useStore';
export { useRouteInfo } from './useRouteInfo';
export type { StoreRedirects, ReactNavigationState, FocusedRouteState } from './types';
