export function createRouterIntegrationStorage() {
    return {
        pendingActions: [],
        renderedScreensIds: new Set(),
        hasRecordedInitialTtr: false,
        screenTimes: {},
        interactiveScreensIds: new Set(),
    };
}
//# sourceMappingURL=storage.js.map