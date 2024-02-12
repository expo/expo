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
const href_1 = require("../link/href");
const path_1 = require("../link/path");
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
function getNavigateAction(state, parentState, type = 'NAVIGATE', target = parentState.key) {
    // Get the current route, which will be the last in the stack
    const route = state.routes[state.routes.length - 1];
    // Find the previous route in the parent state
    const previousRoute = parentState.routes.findLast((parentRoute) => {
        return isSameRoute(route, parentRoute);
    });
    if (route.state && previousRoute?.state) {
        // return getNavigateAction(route.state, previousRoute.state as NavigationState, type, target);
    }
    // Either we reached the bottom of the state or the point where the routes diverged
    const { screen, params } = rewriteNavigationStateToParams(state);
    if (type === 'PUSH' && parentState.type !== 'stack') {
        type = 'NAVIGATE';
    }
    else if (type === 'REPLACE' && parentState.type === 'tab') {
        type = 'JUMP_TO';
    }
    return {
        type,
        target,
        payload: {
            name: screen,
            params,
        },
    };
}
/**
 * Routes match if they share the same name and their preferredId's match
 * @see: https://github.com/react-navigation/react-navigation/blob/a2993721f59d92257cef5608c33a993f8d420a80/packages/routers/src/StackRouter.tsx#L378-L382
 */
function isSameRoute(a = {}, b = {}) {
    if (a.name !== b.name)
        return false;
    if ('state' in b && b.state?.type !== 'stack')
        return false;
    return true;
}
//# sourceMappingURL=routing.js.map