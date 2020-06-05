// Used for delegating node actions when browser APIs aren't available
// like in SSR websites.
export const isDOMAvailable = typeof window !== 'undefined' && !!window.document?.createElement;
//# sourceMappingURL=browser.web.js.map