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
exports.linkTo = exports.setParams = exports.canGoBack = exports.goBack = exports.replace = exports.push = void 0;
const Linking = __importStar(require("expo-linking"));
const href_1 = require("../link/href");
const path_1 = require("../link/path");
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
    if (!state || state.routes.length === 0) {
        console.error('Could not generate a valid navigation state for the given path: ' + href);
        return;
    }
    switch (event) {
        case 'REPLACE':
            return navigationRef.dispatch(getNavigateReplaceAction(state, navigationRef.getRootState()));
        default:
            return navigationRef.dispatch(getNavigatePushAction(state));
    }
}
exports.linkTo = linkTo;
function rewriteNavigationStateToParams(state, params = {}) {
    if (!state)
        return params;
    // We Should always have at least one route in the state
    const lastRoute = state.routes.at(-1);
    params.screen = lastRoute.name;
    // Weirdly, this always needs to be an object. If it's undefined, it won't work.
    params.params = lastRoute.params ? JSON.parse(JSON.stringify(lastRoute.params)) : {};
    if (lastRoute.state) {
        rewriteNavigationStateToParams(lastRoute.state, params.params);
    }
    return JSON.parse(JSON.stringify(params));
}
function getNavigatePushAction(state) {
    const { screen, params } = rewriteNavigationStateToParams(state);
    return {
        type: 'NAVIGATE',
        payload: {
            name: screen,
            params,
        },
    };
}
function getNavigateReplaceAction(previousState, parentState, lastNavigatorSupportingReplace = parentState) {
    // We should always have at least one route in the state
    const state = previousState.routes.at(-1);
    // Only these navigators support replace
    if (parentState.type === 'stack' || parentState.type === 'tab') {
        lastNavigatorSupportingReplace = parentState;
    }
    const currentRoute = parentState.routes.find((route) => route.name === state.name);
    const routesAreEqual = parentState.routes[parentState.index] === currentRoute;
    // If there is nested state and the routes are equal, we should keep going down the tree
    if (state.state && routesAreEqual && currentRoute.state) {
        return getNavigateReplaceAction(state.state, currentRoute.state, lastNavigatorSupportingReplace);
    }
    // Either we reached the bottom of the state or the point where the routes diverged
    const { screen, params } = rewriteNavigationStateToParams(previousState);
    return {
        type: lastNavigatorSupportingReplace.type === 'stack' ? 'REPLACE' : 'JUMP_TO',
        payload: {
            name: screen,
            params,
            // Ensure that the last navigator supporting replace is the one that handles the action
            source: lastNavigatorSupportingReplace?.key,
        },
    };
}
//# sourceMappingURL=routing.js.map