"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDomComponentContextReceiver = exports.useDomComponentNavigation = exports.emitDomLinkEvent = exports.emitDomDismissAll = exports.emitDomGoBack = exports.emitDomDismiss = exports.emitDomSetParams = exports.emitDomSetOptions = void 0;
const global_1 = require("expo/dom/global");
const react_1 = __importStar(require("react"));
const useNavigation_1 = require("../useNavigation");
const ROUTER_LINK_TYPE = '$$router_link';
const ROUTER_DISMISS_ALL_TYPE = '$$router_dismissAll';
const ROUTER_DISMISS_TYPE = '$$router_dismiss';
const ROUTER_BACK_TYPE = '$$router_goBack';
const ROUTER_SET_PARAMS_TYPE = '$$router_setParams';
const ROUTER_SET_OPTIONS_TYPE = '$$router_setOptions';
function emitDomEvent(type, data = {}) {
    // @ts-expect-error: ReactNativeWebView is a global variable injected by the WebView
    if (typeof ReactNativeWebView !== 'undefined') {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type, data }));
        return true;
    }
    return false;
}
function emitDomSetOptions(params = {}) {
    return emitDomEvent(ROUTER_SET_OPTIONS_TYPE, { params });
}
exports.emitDomSetOptions = emitDomSetOptions;
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
function useDomComponentContextReceiver() {
    if (process.env.EXPO_OS === 'web') {
        return () => { };
    }
    // TODO: Make this optional.
    const navigation = (0, useNavigation_1.useNavigation)();
    return (0, react_1.useCallback)(({ type, data }) => {
        switch (type) {
            case ROUTER_SET_OPTIONS_TYPE:
                navigation.setOptions(data.params);
                break;
        }
    }, [navigation]);
}
exports.useDomComponentContextReceiver = useDomComponentContextReceiver;
//# sourceMappingURL=useDomComponentNavigation.js.map