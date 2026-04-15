let initialPathname;
export function initRouterNavigationEvents() {
    if (globalThis && globalThis.expo && 'router' in globalThis.expo) {
        const router = globalThis.expo.router;
        router?.navigationEvents?.enable?.();
        router?.navigationEvents?.saveCurrentPathname?.();
        router?.navigationEvents?.addListener?.('pageFocused', ({ pathname }) => {
            if (!initialPathname) {
                initialPathname = pathname;
            }
        });
    }
}
export function getInitialRouteName() {
    return initialPathname;
}
//# sourceMappingURL=routerIntegration.js.map