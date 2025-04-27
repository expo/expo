"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitDomSetParams = emitDomSetParams;
exports.emitDomDismiss = emitDomDismiss;
exports.emitDomGoBack = emitDomGoBack;
exports.emitDomDismissAll = emitDomDismissAll;
exports.emitDomLinkEvent = emitDomLinkEvent;
exports.useDomComponentNavigation = useDomComponentNavigation;
const global_1 = require("expo/dom/global");
const react_1 = __importDefault(require("react"));
const routing_1 = require("../global-state/routing");
const ROUTER_LINK_TYPE = '$$router_link';
const ROUTER_DISMISS_ALL_TYPE = '$$router_dismissAll';
const ROUTER_DISMISS_TYPE = '$$router_dismiss';
const ROUTER_BACK_TYPE = '$$router_goBack';
const ROUTER_SET_PARAMS_TYPE = '$$router_setParams';
function emitDomEvent(type, data = {}) {
    // @ts-expect-error: ReactNativeWebView is a global variable injected by the WebView
    if (typeof ReactNativeWebView !== 'undefined') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
        return true;
    }
    return false;
}
function emitDomSetParams(params = {}) {
    return emitDomEvent(ROUTER_SET_PARAMS_TYPE, { params });
}
function emitDomDismiss(count) {
    return emitDomEvent(ROUTER_DISMISS_TYPE, { count });
}
function emitDomGoBack() {
    return emitDomEvent(ROUTER_BACK_TYPE);
}
function emitDomDismissAll() {
    return emitDomEvent(ROUTER_DISMISS_ALL_TYPE);
}
function emitDomLinkEvent(href, options) {
    return emitDomEvent(ROUTER_LINK_TYPE, { href, options });
}
function useDomComponentNavigation(store) {
    react_1.default.useEffect(() => {
        if (process.env.EXPO_OS === 'web') {
            return () => { };
        }
        return (0, global_1.addGlobalDomEventListener)(({ type, data }) => {
            switch (type) {
                case ROUTER_LINK_TYPE:
                    (0, routing_1.linkTo)(data.href, data.options);
                    break;
                case ROUTER_DISMISS_ALL_TYPE:
                    (0, routing_1.dismissAll)();
                    break;
                case ROUTER_DISMISS_TYPE:
                    (0, routing_1.dismiss)(data.count);
                    break;
                case ROUTER_BACK_TYPE:
                    (0, routing_1.goBack)();
                    break;
                case ROUTER_SET_PARAMS_TYPE:
                    (0, routing_1.setParams)(data.params);
                    break;
            }
        });
    }, [store]);
}
//# sourceMappingURL=useDomComponentNavigation.js.map