"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitDomSetParams = emitDomSetParams;
exports.emitDomDismiss = emitDomDismiss;
exports.emitDomGoBack = emitDomGoBack;
exports.emitDomDismissAll = emitDomDismissAll;
exports.emitDomLinkEvent = emitDomLinkEvent;
const events_1 = require("./events");
function emitDomEvent(type, data = {}) {
    // @ts-expect-error: ReactNativeWebView is a global variable injected by the WebView
    if (typeof ReactNativeWebView !== 'undefined') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
        return true;
    }
    return false;
}
function emitDomSetParams(params = {}) {
    return emitDomEvent(events_1.ROUTER_SET_PARAMS_TYPE, { params });
}
function emitDomDismiss(count) {
    return emitDomEvent(events_1.ROUTER_DISMISS_TYPE, { count });
}
function emitDomGoBack() {
    return emitDomEvent(events_1.ROUTER_BACK_TYPE);
}
function emitDomDismissAll() {
    return emitDomEvent(events_1.ROUTER_DISMISS_ALL_TYPE);
}
function emitDomLinkEvent(href, options) {
    return emitDomEvent(events_1.ROUTER_LINK_TYPE, { href, options });
}
//# sourceMappingURL=emitDomEvent.js.map