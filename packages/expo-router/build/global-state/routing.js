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
exports.linkTo = exports.setParams = exports.canGoBack = exports.goBack = exports.replace = exports.push = exports.navigate = void 0;
const Linking = __importStar(require("expo-linking"));
const href_1 = require("../link/href");
const path_1 = require("../link/path");
const url_1 = require("../utils/url");
function assertIsReady(store) {
    if (!store.navigationRef.isReady()) {
        throw new Error('Attempted to navigate before mounting the Root Layout component. Ensure the Root Layout component is rendering a Slot, or other navigator on the first render.');
    }
}
function navigate(url) {
    return this.linkTo((0, href_1.resolveHref)(url));
}
exports.navigate = navigate;
function push(url) {
    return this.linkTo((0, href_1.resolveHref)(url), 'PUSH');
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
    switch (event) {
        case 'REPLACE':
            return navigationRef.dispatch(getNavigateReplaceAction(state, rootState));
        case 'PUSH':
            return navigationRef.dispatch(getNavigatePushAction(state, rootState));
        default:
            return navigationRef.dispatch(getNavigateAction(state, rootState));
    }
}
exports.linkTo = linkTo;
function rewriteNavigationStateToParams(state, params = {}) {
    if (!state)
        return params;
    // We Should always have at least one route in the state
    const lastRoute = state.routes[state.routes.length - 1];
    params.screen = lastRoute.name;
    // Weirdly, this always needs to be an object. If it's undefined, it won't work.
    params.params = lastRoute.params ? JSON.parse(JSON.stringify(lastRoute.params)) : {};
    if (lastRoute.state) {
        rewriteNavigationStateToParams(lastRoute.state, params.params);
    }
    return JSON.parse(JSON.stringify(params));
}
function getNavigateAction(state, rootState) {
    const { screen, params } = rewriteNavigationStateToParams(state);
    return {
        type: 'NAVIGATE',
        target: rootState.key,
        payload: {
            name: screen,
            params,
        },
    };
}
function getNavigatePushAction(desiredState, rootState) {
    const sharedParents = getSharedNavigators(desiredState, rootState, false);
    const lastSharedParent = sharedParents.at(-1);
    if (lastSharedParent?.type === 'stack') {
        const { screen, params } = rewriteNavigationStateToParams(desiredState);
        return {
            type: 'PUSH',
            target: lastSharedParent.key,
            payload: {
                name: screen,
                params,
            },
        };
    }
    else {
        return getNavigateAction(desiredState, rootState);
    }
}
function getNavigateReplaceAction(desiredState, navigationState) {
    const sharedParents = getSharedNavigators(desiredState, navigationState);
    const lastNavigatorSupportingReplace = sharedParents?.findLast((parent) => parent.type === 'stack' || parent.type === 'tab') ?? -1;
    if (lastNavigatorSupportingReplace === -1) {
        throw new Error();
    }
    const { screen, params } = rewriteNavigationStateToParams(desiredState);
    return {
        type: lastNavigatorSupportingReplace.type === 'stack' ? 'REPLACE' : 'JUMP_TO',
        target: lastNavigatorSupportingReplace?.key,
        payload: {
            name: screen,
            params,
        },
    };
}
function getSharedNavigators(left, right, allowPartial = true, shared = []) {
    shared.push(right);
    const leftRoute = left.routes.at(-1);
    const matchedRoute = right.routes.find((route) => route.name === leftRoute.name);
    const routesShareNavigator = right.routes[right.index] === matchedRoute;
    if (routesShareNavigator && leftRoute.state && matchedRoute.state) {
        return getSharedNavigators(leftRoute.state, matchedRoute.state, allowPartial, shared);
    }
    const isPartialMatch = shared.length > 1 || leftRoute.state || matchedRoute?.state;
    if (allowPartial && isPartialMatch) {
        return shared;
    }
    else if (!isPartialMatch) {
        return shared;
    }
    return [];
}
//# sourceMappingURL=routing.js.map