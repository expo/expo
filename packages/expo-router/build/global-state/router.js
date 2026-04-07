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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
exports.navigate = navigate;
exports.reload = reload;
exports.prefetch = prefetch;
exports.push = push;
exports.dismiss = dismiss;
exports.dismissTo = dismissTo;
exports.replace = replace;
exports.dismissAll = dismissAll;
exports.goBack = goBack;
exports.canGoBack = canGoBack;
exports.canDismiss = canDismiss;
exports.setParams = setParams;
exports.linkTo = linkTo;
const dom_1 = require("expo/dom");
const Linking = __importStar(require("expo-linking"));
const react_native_1 = require("react-native");
const routingQueue_1 = require("./routingQueue");
const store_1 = require("./store");
const emitDomEvent_1 = require("../domComponents/emitDomEvent");
const href_1 = require("../link/href");
const url_1 = require("../utils/url");
function navigate(url, options) {
    return linkTo((0, href_1.resolveHref)(url), { ...options, event: 'NAVIGATE' });
}
function reload() {
    // TODO(EvanBacon): add `reload` support.
    throw new Error('The reload method is not implemented in the client-side router yet.');
}
function prefetch(href, options) {
    return linkTo((0, href_1.resolveHref)(href), { ...options, event: 'PRELOAD' });
}
function push(url, options) {
    return linkTo((0, href_1.resolveHref)(url), { ...options, event: 'PUSH' });
}
function dismiss(count = 1) {
    if ((0, emitDomEvent_1.emitDomDismiss)(count)) {
        return;
    }
    routingQueue_1.routingQueue.add({ type: 'POP', payload: { count } });
}
function dismissTo(href, options) {
    return linkTo((0, href_1.resolveHref)(href), { ...options, event: 'POP_TO' });
}
function replace(url, options) {
    return linkTo((0, href_1.resolveHref)(url), { ...options, event: 'REPLACE' });
}
function dismissAll() {
    if ((0, emitDomEvent_1.emitDomDismissAll)()) {
        return;
    }
    routingQueue_1.routingQueue.add({ type: 'POP_TO_TOP' });
}
function goBack() {
    if ((0, emitDomEvent_1.emitDomGoBack)()) {
        return;
    }
    store_1.store.assertIsReady();
    routingQueue_1.routingQueue.add({ type: 'GO_BACK' });
}
function canGoBack() {
    if (dom_1.IS_DOM) {
        throw new Error('canGoBack imperative method is not supported. Pass the property to the DOM component instead.');
    }
    // Return a default value here if the navigation hasn't mounted yet.
    // This can happen if the user calls `canGoBack` from the Root Layout route
    // before mounting a navigator. This behavior exists due to React Navigation being dynamically
    // constructed at runtime. We can get rid of this in the future if we use
    // the static configuration internally.
    if (!store_1.store.navigationRef.isReady()) {
        return false;
    }
    return store_1.store.navigationRef?.current?.canGoBack() ?? false;
}
function canDismiss() {
    if (dom_1.IS_DOM) {
        throw new Error('canDismiss imperative method is not supported. Pass the property to the DOM component instead.');
    }
    let state = store_1.store.state;
    // Keep traversing down the state tree until we find a stack navigator that we can pop
    while (state) {
        if (state.type === 'stack' && state.routes.length > 1) {
            return true;
        }
        if (state.index === undefined)
            return false;
        state = state.routes?.[state.index]?.state;
    }
    return false;
}
function setParams(params = {}) {
    if ((0, emitDomEvent_1.emitDomSetParams)(params)) {
        return;
    }
    store_1.store.assertIsReady();
    return (store_1.store.navigationRef?.current?.setParams)(params);
}
function linkTo(originalHref, options = {}) {
    originalHref = typeof originalHref == 'string' ? originalHref : (0, href_1.resolveHref)(originalHref);
    let href = originalHref;
    if ((0, emitDomEvent_1.emitDomLinkEvent)(href, options)) {
        return;
    }
    if ((0, url_1.shouldLinkExternally)(href)) {
        if (href.startsWith('//') && react_native_1.Platform.OS !== 'web') {
            href = `https:${href}`;
        }
        Linking.openURL(href);
        return;
    }
    if (href === '..' || href === '../') {
        store_1.store.assertIsReady();
        const navigationRef = store_1.store.navigationRef.current;
        if (navigationRef == null) {
            throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
        }
        if (!store_1.store.linking) {
            throw new Error('Attempted to link to route when no routes are present');
        }
        navigationRef.goBack();
        return;
    }
    const linkAction = {
        type: 'ROUTER_LINK',
        payload: {
            href,
            options,
        },
    };
    routingQueue_1.routingQueue.add(linkAction);
}
/**
 * @hidden
 */
exports.router = {
    navigate,
    push,
    dismiss,
    dismissAll,
    dismissTo,
    canDismiss,
    replace,
    back: () => goBack(),
    canGoBack,
    reload,
    prefetch,
    setParams: setParams,
};
//# sourceMappingURL=router.js.map