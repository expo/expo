import { ROUTER_SET_PARAMS_TYPE, ROUTER_DISMISS_TYPE, ROUTER_BACK_TYPE, ROUTER_DISMISS_ALL_TYPE, ROUTER_LINK_TYPE, } from './events';
function emitDomEvent(type, data = {}) {
    // @ts-expect-error: ReactNativeWebView is a global variable injected by the WebView
    if (typeof ReactNativeWebView !== 'undefined') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
        return true;
    }
    return false;
}
export function emitDomSetParams(params = {}) {
    return emitDomEvent(ROUTER_SET_PARAMS_TYPE, { params });
}
export function emitDomDismiss(count) {
    return emitDomEvent(ROUTER_DISMISS_TYPE, { count });
}
export function emitDomGoBack() {
    return emitDomEvent(ROUTER_BACK_TYPE);
}
export function emitDomDismissAll() {
    return emitDomEvent(ROUTER_DISMISS_ALL_TYPE);
}
export function emitDomLinkEvent(href, options) {
    return emitDomEvent(ROUTER_LINK_TYPE, { href, options });
}
//# sourceMappingURL=emitDomEvent.js.map