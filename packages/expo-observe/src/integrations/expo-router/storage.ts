export interface ScreenTimes {
  dispatchTime?: number;
  isAppLaunch?: boolean;
  lastInteractiveCall?: number;
}

export interface PendingAction {
  actionType: string;
  // When the action was enqueued, or dispatched if expo-router did not mark the enqueue.
  startTime: number;
}

export interface RouterIntegrationStorage {
  /**
   * Actions dispatched, but not yet processed by the integration
   */
  pendingActions: PendingAction[];
  /**
   * Enqueue times by `actionId`. Older ids are dropped when an action dispatches
   */
  enqueueTimes: Map<number, number>;
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
    enqueueTimes: new Map(),
    renderedScreensIds: new Set(),
    hasRecordedInitialTtr: false,
    screenTimes: {},
    interactiveScreensIds: new Set(),
  };
}
