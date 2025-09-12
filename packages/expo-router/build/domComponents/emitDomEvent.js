"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitDomSetParams = emitDomSetParams;
exports.emitDomDismiss = emitDomDismiss;
exports.emitDomGoBack = emitDomGoBack;
exports.emitDomDismissAll = emitDomDismissAll;
exports.emitDomLinkEvent = emitDomLinkEvent;
const events_1 = require("./events");
const IS_DOM = typeof window !== 'undefined' && window.isDOMComponentContext === true;
function emitDomEvent(type, data = {}) {
    if (IS_DOM) {
        // @ts-expect-error: Added via react-native-webview
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