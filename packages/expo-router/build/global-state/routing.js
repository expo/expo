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
exports.isAbsoluteInitialRoute = exports.linkTo = exports.setParams = exports.canGoBack = exports.goBack = exports.replace = exports.push = void 0;
const core_1 = require("@react-navigation/core");
const native_1 = require("@react-navigation/native");
const Linking = __importStar(require("expo-linking"));
const href_1 = require("../link/href");
const path_1 = require("../link/path");
const stateOperations_1 = require("../link/stateOperations");
const url_1 = require("../utils/url");
function assertIsReady(store) {
    if (!store.navigationRef.isReady()) {
        throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
    }
}
function push(url) {
    return this.linkTo((0, href_1.resolveHref)(url));
}
exports.push = push;
function replace(url) {
    return this.linkTo((0, href_1.resolveHref)(url), 'REPLACE');
}
exports.replace = replace;
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
function setParams(params = {}) {
    assertIsReady(this);
    return (this.navigationRef?.current?.setParams)(params);
}
exports.setParams = setParams;
function linkTo(href, event) {
    if ((0, url_1.hasUrlProtocolPrefix)(href)) {
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
    if (href.startsWith('.')) {
        let base = this.linking.getPathFromState?.(navigationRef.getRootState(), {
            screens: [],
            preserveGroups: true,
        }) ?? '';
        if (base && !base.endsWith('/')) {
            base += '/..';
        }
        href = (0, path_1.resolve)(base, href);
    }
    const state = this.linking.getStateFromPath(href, this.linking.config);
    if (!state) {
        console.error('Could not generate a valid navigation state for the given path: ' + href);
        return;
    }
    const rootState = navigationRef.getRootState();
    // Ensure simple operations are used when moving between siblings
    // in the same navigator. This ensures that the state is not reset.
    // TODO: We may need to apply this at a larger scale in the future.
    if ((0, stateOperations_1.isMovingToSiblingRoute)(rootState, state)) {
        // Can perform naive movements
        const knownOwnerState = (0, stateOperations_1.getQualifiedStateForTopOfTargetState)(rootState, state);
        const nextRoute = (0, stateOperations_1.findTopRouteForTarget)(state);
        // NOTE(EvanBacon): There's an issue where moving from "a -> b" is considered siblings:
        // a. index (initialRouteName="index")
        // b. stack/index
        // However, the preservation approach doesn't work because it would be moving to a route with the same name.
        // The next check will see if the current focused route has the same name as the next route, if so, then fallback on
        // the default React Navigation logic.
        if ((0, stateOperations_1.findTopRouteForTarget)(
        // @ts-expect-error: stale types don't matter here
        rootState)?.name !== nextRoute.name) {
            if (event === 'REPLACE') {
                if (knownOwnerState.type === 'tab') {
                    navigationRef.dispatch(native_1.TabActions.jumpTo(nextRoute.name, nextRoute.params));
                }
                else {
                    navigationRef.dispatch(core_1.StackActions.replace(nextRoute.name, nextRoute.params));
                }
            }
            else {
                // NOTE: Not sure if we should pop or push here...
                navigationRef.dispatch(core_1.CommonActions.navigate(nextRoute.name, nextRoute.params));
            }
            return;
        }
    }
    // TODO: Advanced movements across multiple navigators
    const action = (0, core_1.getActionFromState)(state, this.linking.config);
    if (action) {
        // Here we have a navigation action to a nested screen, where we should ideally replace.
        // This request can only be fulfilled if the target is an initial route.
        // First, check if the action is fully initial routes.
        // Then find the nearest mismatched route in the existing state.
        // Finally, use the correct navigator-based action to replace the nested screens.
        // NOTE(EvanBacon): A future version of this will involve splitting the navigation request so we replace as much as possible, then push the remaining screens to fulfill the request.
        if (event === 'REPLACE' && isAbsoluteInitialRoute(action)) {
            const earliest = (0, stateOperations_1.getEarliestMismatchedRoute)(rootState, action.payload);
            if (earliest) {
                if (earliest.type === 'stack') {
                    navigationRef.dispatch(core_1.StackActions.replace(earliest.name, earliest.params));
                }
                else {
                    navigationRef.dispatch(native_1.TabActions.jumpTo(earliest.name, earliest.params));
                }
                return;
            }
            else {
                // This should never happen because moving to the same route would be handled earlier
                // in the sibling operations.
            }
        }
        // Ignore the replace event here since replace across
        // navigators is not supported.
        navigationRef.dispatch(action);
    }
    else {
        navigationRef.reset(state);
    }
}
exports.linkTo = linkTo;
/** @returns `true` if the action is moving to the first screen of all the navigators in the action. */
function isAbsoluteInitialRoute(action) {
    if (action?.type !== 'NAVIGATE') {
        return false;
    }
    let next = action.payload.params;
    // iterate all child screens and bail out if any are not initial.
    while (next) {
        if (!isNavigationState(next)) {
            // Not sure when this would happen
            return false;
        }
        if (next.initial === true) {
            next = next.params;
            // return true;
        }
        else if (next.initial === false) {
            return false;
        }
    }
    return true;
}
exports.isAbsoluteInitialRoute = isAbsoluteInitialRoute;
function isNavigationState(obj) {
    return 'initial' in obj;
}
//# sourceMappingURL=routing.js.map