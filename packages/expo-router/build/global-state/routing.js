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
exports.routingQueue = void 0;
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
exports.getPayloadFromStateRoute = getPayloadFromStateRoute;
exports.findDivergentState = findDivergentState;
const dom_1 = require("expo/dom");
const Linking = __importStar(require("expo-linking"));
const react_native_1 = require("react-native");
const router_store_1 = require("./router-store");
const emitDomEvent_1 = require("../domComponents/emitDomEvent");
const getRoutesRedirects_1 = require("../getRoutesRedirects");
const href_1 = require("../link/href");
const matchers_1 = require("../matchers");
const navigationParams_1 = require("../navigationParams");
const url_1 = require("../utils/url");
function assertIsReady() {
    if (!router_store_1.store.navigationRef.isReady()) {
        throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
    }
}
exports.routingQueue = {
    queue: [],
    subscribers: new Set(),
    subscribe(callback) {
        exports.routingQueue.subscribers.add(callback);
        return () => {
            exports.routingQueue.subscribers.delete(callback);
        };
    },
    snapshot() {
        return exports.routingQueue.queue;
    },
    add(action) {
        exports.routingQueue.queue.push(action);
        for (const callback of exports.routingQueue.subscribers) {
            callback();
        }
    },
    run(ref) {
        // Reset the identity of the queue.
        const events = exports.routingQueue.queue;
        exports.routingQueue.queue = [];
        let action;
        while ((action = events.shift())) {
            if (ref.current) {
                ref.current.dispatch(action);
            }
        }
    },
};
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
    exports.routingQueue.add({ type: 'POP', payload: { count } });
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
    exports.routingQueue.add({ type: 'POP_TO_TOP' });
}
function goBack() {
    if ((0, emitDomEvent_1.emitDomGoBack)()) {
        return;
    }
    assertIsReady();
    exports.routingQueue.add({ type: 'GO_BACK' });
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
    if (!router_store_1.store.navigationRef.isReady()) {
        return false;
    }
    return router_store_1.store.navigationRef?.current?.canGoBack() ?? false;
}
function canDismiss() {
    if (dom_1.IS_DOM) {
        throw new Error('canDismiss imperative method is not supported. Pass the property to the DOM component instead.');
    }
    let state = router_store_1.store.state;
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
    assertIsReady();
    return (router_store_1.store.navigationRef?.current?.setParams)(params);
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
    assertIsReady();
    const navigationRef = router_store_1.store.navigationRef.current;
    if (navigationRef == null) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    if (!router_store_1.store.linking) {
        throw new Error('Attempted to link to route when no routes are present');
    }
    if (href === '..' || href === '../') {
        navigationRef.goBack();
        return;
    }
    const rootState = navigationRef.getRootState();
    href = (0, href_1.resolveHrefStringWithSegments)(href, router_store_1.store.getRouteInfo(), options);
    href = (0, getRoutesRedirects_1.applyRedirects)(href, router_store_1.store.redirects);
    // If the href is undefined, it means that the redirect has already been handled the navigation
    if (!href) {
        return;
    }
    const state = router_store_1.store.linking.getStateFromPath(href, router_store_1.store.linking.config);
    if (!state || state.routes.length === 0) {
        console.error('Could not generate a valid navigation state for the given path: ' + href);
        return;
    }
    exports.routingQueue.add(getNavigateAction(state, rootState, options.event, options.withAnchor, options.dangerouslySingular, !!options.__internal__PreviewKey));
}
function getNavigateAction(_actionState, _navigationState, type = 'NAVIGATE', withAnchor, singular, isPreviewNavigation) {
    /**
     * We need to find the deepest navigator where the action and current state diverge, If they do not diverge, the
     * lowest navigator is the target.
     *
     * By default React Navigation will target the current navigator, but this doesn't work for all actions
     * For example:
     *  - /deeply/nested/route -> /top-level-route the target needs to be the top-level navigator
     *  - /stack/nestedStack/page -> /stack1/nestedStack/other-page needs to target the nestedStack navigator
     *
     * This matching needs to done by comparing the route names and the dynamic path, for example
     * - /1/page -> /2/anotherPage needs to target the /[id] navigator
     *
     * Other parameters such as search params and hash are not evaluated.
     */
    const { actionStateRoute, navigationState } = findDivergentState(_actionState, _navigationState, type === 'PRELOAD');
    /*
     * We found the target navigator, but the payload is in the incorrect format
     * We need to convert the action state to a payload that can be dispatched
     */
    const rootPayload = getPayloadFromStateRoute(actionStateRoute || {});
    if (type === 'PUSH' && navigationState.type !== 'stack') {
        type = 'NAVIGATE';
    }
    else if (navigationState.type === 'expo-tab') {
        type = 'JUMP_TO';
    }
    else if (type === 'REPLACE' && navigationState.type === 'drawer') {
        type = 'JUMP_TO';
    }
    if (withAnchor !== undefined) {
        if (rootPayload.params.initial) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(`The parameter 'initial' is a reserved parameter name in React Navigation`);
            }
        }
        /*
         * The logic for initial can seen backwards depending on your perspective
         *   True: The initialRouteName is not loaded. The incoming screen is the initial screen (default)
         *   False: The initialRouteName is loaded. THe incoming screen is placed after the initialRouteName
         *
         * withAnchor flips the perspective.
         *   True: You want the initialRouteName to load.
         *   False: You do not want the initialRouteName to load.
         */
        rootPayload.params.initial = !withAnchor;
    }
    const expoParams = isPreviewNavigation
        ? {
            __internal__expo_router_is_preview_navigation: true,
            __internal_expo_router_no_animation: true,
        }
        : {};
    const params = (0, navigationParams_1.appendInternalExpoRouterParams)(rootPayload.params, expoParams);
    return {
        type,
        target: navigationState.key,
        payload: {
            // key: rootPayload.key,
            name: rootPayload.screen,
            params,
            singular,
        },
    };
}
/**
 * React Navigation uses params to store information about the screens, rather then create new state for each level.
 * This function traverses the action state that will not be part of state and returns a payload that can be used in action.
 */
function getPayloadFromStateRoute(_actionStateRoute) {
    const rootPayload = { params: {} };
    let payload = rootPayload;
    let params = payload.params;
    let actionStateRoute = _actionStateRoute;
    while (actionStateRoute) {
        Object.assign(params, { ...payload.params, ...actionStateRoute.params });
        // Assign the screen name to the payload
        payload.screen = actionStateRoute.name;
        // Merge the params, ensuring that we create a new object
        payload.params = { ...params };
        // Params don't include the screen, thats a separate attribute
        delete payload.params['screen'];
        // Continue down the payload tree
        // Initially these values are separate, but React Nav merges them after the first layer
        payload = payload.params;
        params = payload;
        actionStateRoute = actionStateRoute.state?.routes[actionStateRoute.state?.routes.length - 1];
    }
    return rootPayload;
}
/*
 * Traverse the state tree comparing the current state and the action state until we find where they diverge
 */
function findDivergentState(_actionState, _navigationState, 
// If true, look through all tabs to find the target state, rather then just the current tab
lookThroughAllTabs = false) {
    let actionState = _actionState;
    let navigationState = _navigationState;
    let actionStateRoute;
    const navigationRoutes = [];
    while (actionState && navigationState) {
        actionStateRoute = actionState.routes[actionState.routes.length - 1];
        const stateRoute = (() => {
            if (navigationState.type === 'tab' && lookThroughAllTabs) {
                return (navigationState.routes.find((route) => route.name === actionStateRoute?.name) ||
                    navigationState.routes[navigationState.index ?? 0]);
            }
            return navigationState.routes[navigationState.index ?? 0];
        })();
        const childState = actionStateRoute.state;
        const nextNavigationState = stateRoute.state;
        const dynamicName = (0, matchers_1.matchDynamicName)(actionStateRoute.name);
        const didActionAndCurrentStateDiverge = actionStateRoute.name !== stateRoute.name ||
            !childState ||
            !nextNavigationState ||
            (dynamicName &&
                // @ts-expect-error: TODO(@kitten): This isn't properly typed, so the index access fails
                actionStateRoute.params?.[dynamicName.name] !== stateRoute.params?.[dynamicName.name]);
        if (didActionAndCurrentStateDiverge) {
            // If we are looking through all tabs, we need to add new tab id if this is the last route
            // Otherwise we wouldn't be able to change the tab
            if (navigationState.type === 'tab' && lookThroughAllTabs) {
                navigationRoutes.push(stateRoute);
            }
            break;
        }
        navigationRoutes.push(stateRoute);
        actionState = childState;
        navigationState = nextNavigationState;
    }
    return {
        actionState,
        navigationState,
        actionStateRoute,
        navigationRoutes,
    };
}
//# sourceMappingURL=routing.js.map