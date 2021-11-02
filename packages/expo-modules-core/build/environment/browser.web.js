// Used for delegating node actions when browser APIs aren't available
// like in SSR websites.
export const isDOMAvailable = typeof window !== 'undefined' && !!window.document?.createElement;
export const canUseEventListeners = isDOMAvailable && !!(window.addEventListener || window.attachEvent);
export const canUseViewport = isDOMAvailable && !!window.screen;
export const isAsyncDebugging = false;
//# sourceMappingURL=browser.web.js.map