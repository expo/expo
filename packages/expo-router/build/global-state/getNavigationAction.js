"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNavigateAction = getNavigateAction;
const stateUtils_1 = require("./stateUtils");
const store_1 = require("./store");
const getRoutesRedirects_1 = require("../getRoutesRedirects");
const href_1 = require("../link/href");
const navigationParams_1 = require("../navigationParams");
function getNavigateAction(baseHref, options, type = 'NAVIGATE', withAnchor, singular, isPreviewNavigation) {
    let href = baseHref;
    store_1.store.assertIsReady();
    const navigationRef = store_1.store.navigationRef.current;
    if (navigationRef == null) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    if (!store_1.store.linking) {
        throw new Error('Attempted to link to route when no routes are present');
    }
    const rootState = navigationRef.getRootState();
    href = (0, href_1.resolveHrefStringWithSegments)(href, store_1.store.getRouteInfo(), options);
    href = (0, getRoutesRedirects_1.applyRedirects)(href, store_1.store.redirects) ?? undefined;
    // If the href is undefined, it means that the redirect has already been handled the navigation
    if (!href) {
        return;
    }
    const state = store_1.store.linking.getStateFromPath(href, store_1.store.linking.config);
    if (!state || state.routes.length === 0) {
        console.error('Could not generate a valid navigation state for the given path: ' + href);
        return;
    }
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
    const { actionStateRoute, navigationState } = (0, stateUtils_1.findDivergentState)(state, rootState, type === 'PRELOAD');
    /*
     * We found the target navigator, but the payload is in the incorrect format
     * We need to convert the action state to a payload that can be dispatched
     */
    const rootPayload = (0, stateUtils_1.getPayloadFromStateRoute)(actionStateRoute || {});
    if (type === 'PUSH' && navigationState.type !== 'stack') {
        type = 'NAVIGATE';
    }
    else if (navigationState.type === 'expo-tab') {
        type = 'JUMP_TO';
    }
    else if (type === 'REPLACE' && navigationState.type === 'drawer') {
        type = 'JUMP_TO';
    }
    if (withAnchor) {
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
        // Set initial on root and all nested params so anchors are loaded at every level
        let currentParams = rootPayload.params;
        while (currentParams) {
            currentParams.initial = !withAnchor;
            currentParams = currentParams.params;
        }
    }
    const expoParams = isPreviewNavigation
        ? {
            [navigationParams_1.INTERNAL_EXPO_ROUTER_IS_PREVIEW_NAVIGATION_PARAM_NAME]: true,
            [navigationParams_1.INTERNAL_EXPO_ROUTER_NO_ANIMATION_PARAM_NAME]: true,
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
//# sourceMappingURL=getNavigationAction.js.map