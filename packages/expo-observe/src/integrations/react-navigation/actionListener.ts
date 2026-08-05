import type { ReactNavigationIntegrationStorage } from './storage';

export interface NavigationRefActionListenerHandle {
  addListener(
    event: '__unsafe_action__',
    cb: (e: { data: { action: { type: string; payload?: object }; noop: boolean } }) => void
  ): () => void;
}

export function attachActionListener(
  navigationRef: NavigationRefActionListenerHandle,
  storage: ReactNavigationIntegrationStorage
): () => void {
  return navigationRef.addListener('__unsafe_action__', (e) => {
    if (e.data.noop) return;
    // PRELOAD comes from preload APIs (e.g. native-stack `unstable_preload`) —
    // a warm-up, not a user navigation — so it must not seed dispatchTime.
    if (e.data.action.type === 'PRELOAD') return;
    storage.pendingActions.push({
      actionType: e.data.action.type,
      dispatchTime: performance.now(),
    });
  });
}
