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
exports.linkTo = exports.setParams = exports.canDismiss = exports.canGoBack = exports.goBack = exports.dismissAll = exports.replace = exports.dismiss = exports.push = exports.navigate = void 0;
const native_1 = require("@react-navigation/native");
const Linking = __importStar(require("expo-linking"));
const non_secure_1 = require("nanoid/non-secure");
const href_1 = require("../link/href");
const path_1 = require("../link/path");
const matchers_1 = require("../matchers");
const url_1 = require("../utils/url");
function assertIsReady(store) {
    if (!store.navigationRef.isReady()) {
        throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
    }
}
function navigate(url) {
    return this.linkTo((0, href_1.resolveHref)(url), 'NAVIGATE');
}
exports.navigate = navigate;
function push(url) {
    return this.linkTo((0, href_1.resolveHref)(url), 'PUSH');
}
exports.push = push;
function dismiss(count) {
    this.navigationRef?.dispatch(native_1.StackActions.pop(count));
}
exports.dismiss = dismiss;
function replace(url) {
    return this.linkTo((0, href_1.resolveHref)(url), 'REPLACE');
}
exports.replace = replace;
function dismissAll() {
    this.navigationRef?.dispatch(native_1.StackActions.popToTop());
}
exports.dismissAll = dismissAll;
function goBack() {
    assertIsReady(this);
    this.navigationRef?.current?.goBack();
}
exports.goBack = goBack;
function canGoBack() {
    // Return a default value here if the navigation hasn't mounted yet.
    // This can happen if the user calls `canGoBack` from the Root Layout route
    // before mounting a navigator. This behavior exists due to React Navigation being dynamically
    // constructed at runtime. We can get rid of this in the future if we use
    // the static configuration internally.
    if (!this.navigationRef.isReady()) {
        return false;
    }
    return this.navigationRef?.current?.canGoBack() ?? false;
}
exports.canGoBack = canGoBack;
function canDismiss() {
    let state = this.rootState;
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
exports.canDismiss = canDismiss;
function setParams(params = {}) {
    assertIsReady(this);
    return (this.navigationRef?.current?.setParams)(params);
}
exports.setParams = setParams;
function linkTo(href, event) {
    if ((0, url_1.shouldLinkExternally)(href)) {
        Linking.openURL(href);
        return;
    }
    assertIsReady(this);
    const navigationRef = this.navigationRef.current;
    if (navigationRef == null) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    if (!this.linking) {
        throw new Error('Attempted to link to route when no routes are present');
    }
    if (href === '..' || href === '../') {
        navigationRef.goBack();
        return;
    }
    const rootState = navigationRef.getRootState();
    if (href.startsWith('.')) {
        // Resolve base path by merging the current segments with the params
        let base = this.routeInfo?.segments
            ?.map((segment) => {
            if (!segment.startsWith('['))
                return segment;
            if (segment.startsWith('[...')) {
                segment = segment.slice(4, -1);
                const params = this.routeInfo?.params?.[segment];
                if (Array.isArray(params)) {
                    return params.join('/');
                }
                else {
                    return params?.split(',')?.join('/') ?? '';
                }
            }
            else {
                segment = segment.slice(1, -1);
                return this.routeInfo?.params?.[segment];
            }
        })
            .filter(Boolean)
            .join('/') ?? '/';
        if (!this.routeInfo?.isIndex) {
            base += '/..';
        }
        href = (0, path_1.resolve)(base, href);
    }
    const state = this.linking.getStateFromPath(href, this.linking.config);
    if (!state || state.routes.length === 0) {
        console.error('Could not generate a valid navigation state for the given path: ' + href);
        return;
    }
    return navigationRef.dispatch(getNavigateAction(state, rootState, event));
}
exports.linkTo = linkTo;
function getNavigateAction(actionState, navigationState, type = 'NAVIGATE') {
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
    let actionStateRoute;
    // Traverse the state tree comparing the current state and the action state until we find where they diverge
    while (actionState && navigationState) {
        const stateRoute = navigationState.routes[navigationState.index];
        actionStateRoute = actionState.routes[actionState.routes.length - 1];
        const childState = actionStateRoute.state;
        const nextNavigationState = stateRoute.state;
        const dynamicName = (0, matchers_1.matchDynamicName)(actionStateRoute.name);
        const didActionAndCurrentStateDiverge = actionStateRoute.name !== stateRoute.name ||
            !childState ||
            !nextNavigationState ||
            (dynamicName && actionStateRoute.params?.[dynamicName] !== stateRoute.params?.[dynamicName]);
        if (didActionAndCurrentStateDiverge) {
            break;
        }
        actionState = childState;
        navigationState = nextNavigationState;
    }
    /*
     * We found the target navigator, but the payload is in the incorrect format
     * We need to convert the action state to a payload that can be dispatched
     */
    const rootPayload = { params: {} };
    let payload = rootPayload;
    let params = payload.params;
    // The root level of payload is a bit weird, its params are in the child object
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
    // Expo Router uses only three actions, but these don't directly translate to all navigator actions
    if (type === 'PUSH') {
        // Only stack navigators have a push action, and even then we want to use NAVIGATE (see below)
        type = 'NAVIGATE';
        /*
         * The StackAction.PUSH does not work correctly with Expo Router.
         *
         * Expo Router provides a getId() function for every route, altering how React Navigation handles stack routing.
         * Ordinarily, PUSH always adds a new screen to the stack. However, with getId() present, it navigates to the screen with the matching ID instead (by moving the screen to the top of the stack)
         * When you try and push to a screen with the same ID, no navigation will occur
         * Refer to: https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L279-L290
         *
         * Expo Router needs to retain the default behavior of PUSH, consistently adding new screens to the stack, even if their IDs are identical.
         *
         * To resolve this issue, we switch to using a NAVIGATE action with a new key. In the navigate action, screens are matched by either key or getId() function.
         * By generating a unique new key, we ensure that the screen is always pushed onto the stack.
         *
         */
        if (navigationState.type === 'stack') {
            rootPayload.key = `${rootPayload.name}-${(0, non_secure_1.nanoid)()}`; // @see https://github.com/react-navigation/react-navigation/blob/13d4aa270b301faf07960b4cd861ffc91e9b2c46/packages/routers/src/StackRouter.tsx#L406-L407
        }
    }
    if (type === 'REPLACE' && navigationState.type === 'tab') {
        type = 'JUMP_TO';
    }
    return {
        type,
        target: navigationState.key,
        payload: {
            key: rootPayload.key,
            name: rootPayload.screen,
            params: rootPayload.params,
        },
    };
}
//# sourceMappingURL=routing.js.map