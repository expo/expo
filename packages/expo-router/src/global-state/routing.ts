// Re-export shim — preserves all existing import paths.
// TODO: Refactor consumers to import directly from the new modules, then delete this file.

export { routingQueue } from './routingQueue';
export {
  navigate,
  push,
  replace,
  dismiss,
  dismissTo,
  dismissAll,
  goBack,
  canGoBack,
  canDismiss,
  setParams,
  linkTo,
  reload,
  prefetch,
} from './router';
export { findDivergentState, getPayloadFromStateRoute } from './stateUtils';
export type { LinkToOptions, NavigationOptions } from './types';
