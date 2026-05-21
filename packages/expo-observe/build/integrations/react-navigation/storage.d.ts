export type ScreenTimes = {
    dispatchTime?: number;
    lastInteractiveCall?: number;
};
export type PendingAction = {
    actionType: string;
    dispatchTime: number;
};
export type ReactNavigationIntegrationStorage = {
    pendingActions: PendingAction[];
    renderedScreensIds: Set<string>;
    hasRecordedInitialTtr: boolean;
    screenTimes: Record<string, ScreenTimes>;
    interactiveScreensIds: Set<string>;
};
export declare function createReactNavigationIntegrationStorage(): ReactNavigationIntegrationStorage;
//# sourceMappingURL=storage.d.ts.map