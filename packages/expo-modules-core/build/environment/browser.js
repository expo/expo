// In standard node environments there is no DOM API
export const isDOMAvailable = false;
export const canUseEventListeners = false;
export const canUseViewport = false;
export let isAsyncDebugging = false;
if (__DEV__) {
    // These native globals are injected by native React runtimes and not standard browsers
    // we can use them to determine if the JS is being executed in Chrome.
    isAsyncDebugging =
        !global.nativeExtensions && !global.nativeCallSyncHook && !global.RN$Bridgeless;
}
//# sourceMappingURL=browser.js.map