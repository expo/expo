"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDomComponentNavigation = exports.emitDomLinkEvent = exports.emitDomDismissAll = exports.emitDomGoBack = exports.emitDomDismiss = exports.emitDomSetParams = void 0;
const global_1 = require("expo/dom/global");
const react_1 = __importDefault(require("react"));
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
exports.emitDomSetParams = emitDomSetParams;
function emitDomDismiss(count) {
    return emitDomEvent(ROUTER_DISMISS_TYPE, { count });
}
exports.emitDomDismiss = emitDomDismiss;
function emitDomGoBack() {
    return emitDomEvent(ROUTER_BACK_TYPE);
}
exports.emitDomGoBack = emitDomGoBack;
function emitDomDismissAll() {
    return emitDomEvent(ROUTER_DISMISS_ALL_TYPE);
}
exports.emitDomDismissAll = emitDomDismissAll;
function emitDomLinkEvent(href, options) {
    return emitDomEvent(ROUTER_LINK_TYPE, { href, options });
}
exports.emitDomLinkEvent = emitDomLinkEvent;
function useDomComponentNavigation(store) {
    react_1.default.useEffect(() => {
        if (process.env.EXPO_OS === 'web') {
            return () => { };
        }
        return (0, global_1.addGlobalDomEventListener)(({ type, data }) => {
            switch (type) {
                case ROUTER_LINK_TYPE:
                    store.linkTo(data.href, data.options);
                    break;
                case ROUTER_DISMISS_ALL_TYPE:
                    store.dismissAll();
                    break;
                case ROUTER_DISMISS_TYPE:
                    store.dismiss(data.count);
                    break;
                case ROUTER_BACK_TYPE:
                    store.goBack();
                    break;
                case ROUTER_SET_PARAMS_TYPE:
                    store.setParams(data.params);
                    break;
            }
        });
    }, [store]);
}
exports.useDomComponentNavigation = useDomComponentNavigation;
//# sourceMappingURL=useDomComponentNavigation.js.map