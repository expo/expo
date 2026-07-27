export interface ScreenTimes {
  dispatchTime?: number;
  isAppLaunch?: boolean;
  lastInteractiveCall?: number;
}

export interface PendingAction {
  actionType: string;
  dispatchTime: number;
}

export interface RouterIntegrationStorage {
  /**
   * Actions dispatched, but not yet processed by the integration
   */
  pendingActions: PendingAction[];
  renderedScreensIds: Set<string>;
  /**
   * Whether the app had already recorded the first render of the screen
   */
  hasRecordedInitialTtr: boolean;
  /**
   * Times used to calculate spans from dispatch to certain event
   */
  screenTimes: Record<string, ScreenTimes>;
  interactiveScreensIds: Set<string>;
}

export function createRouterIntegrationStorage(): RouterIntegrationStorage {
  return {
    pendingActions: [],
    renderedScreensIds: new Set(),
    hasRecordedInitialTtr: false,
    screenTimes: {},
    interactiveScreensIds: new Set(),
  };
}
