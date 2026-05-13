import type { ActionDispatchedEvent } from 'expo-router';
export interface ScreenTimes {
    dispatchTime: number;
    lastInteractiveCall?: number;
}
export interface PendingAction {
    actionType: ActionDispatchedEvent['actionType'];
    dispatchTime: number;
}
export interface RouterIntegrationStorage {
    /**
     * Actions dispatched, but not yet processed by the integration
     */
    pendingActions: PendingAction[];
    renderedScreensIds: Set<string>;
    /**
     * Wether the app had already recorded the first render of the screen
     */
    hasRecordedInitialTtr: boolean;
    /**
     * Times used to calculate spans from dispatch to certain event
     */
    screenTimes: Record<string, ScreenTimes>;
    interactiveScreensIds: Set<string>;
}
export declare function createRouterIntegrationStorage(): RouterIntegrationStorage;
//# sourceMappingURL=storage.d.ts.map