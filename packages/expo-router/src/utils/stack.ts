import type { ReactNavigationState } from '../global-state/types';

export function getHistoryLength(state: ReactNavigationState): number {
  if (state.history) {
    return state.history.length;
  }

  if (state.type === 'stack') {
    if (state.index === undefined) {
      return 1;
    }

    // All routes after `state.index` are preloaded.
    return state.index + 1;
  }

  // Without a type or history, stack and tabs both use the route count as their history length.
  return state.routes.length;
}
