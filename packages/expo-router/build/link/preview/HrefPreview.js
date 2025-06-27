"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrefPreview = HrefPreview;
const native_1 = require("@react-navigation/native");
const react_1 = require("react");
const PreviewRouteContext_1 = require("./PreviewRouteContext");
const constants_1 = require("../../constants");
const router_store_1 = require("../../global-state/router-store");
const useNavigation_1 = require("../../useNavigation");
const useScreens_1 = require("../../useScreens");
const linking_1 = require("../linking");
function HrefPreview({ href }) {
    const navigation = (0, useNavigation_1.useNavigation)();
    const { routeNode, params, state } = getParamsAndNodeFromHref(href);
    const path = state ? (0, linking_1.getPathFromState)(state) : undefined;
    const value = (0, react_1.useMemo)(() => ({
        params,
        pathname: href.toString(),
        segments: path?.split('/').filter(Boolean) || [],
    }), [params, href]);
    // This can happen in a theoretical case where the state is not yet initialized or is incorrectly initialized.
    // It also check ensures TypeScript type safety.
    if (!routeNode) {
        return null;
    }
    const Component = (0, useScreens_1.getQualifiedRouteComponent)(routeNode);
    return (<PreviewRouteContext_1.PreviewRouteContext value={value}>
      {/* Using NavigationContext to override useNavigation */}
      <native_1.NavigationContext value={navigationPropWithWarnings}>
        <Component navigation={navigation}/>
      </native_1.NavigationContext>
    </PreviewRouteContext_1.PreviewRouteContext>);
}
function getParamsAndNodeFromHref(href) {
    const hrefState = router_store_1.store.getStateForHref(href);
    if (hrefState?.routes[0] && hrefState.routes[0].name !== constants_1.INTERNAL_SLOT_NAME) {
        const error = `Expo Router Error: Expected navigation state to begin with a ${constants_1.INTERNAL_SLOT_NAME} route`;
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(error);
        }
        else {
            console.warn(error);
        }
    }
    // Assuming that root of the state is __root
    const initialState = hrefState?.routes[0]?.state;
    let state = initialState;
    let routeNode = router_store_1.store.routeNode;
    const params = {};
    while (state && routeNode) {
        const route = state.routes[state.index || state.routes.length - 1];
        Object.assign(params, route.params);
        state = route.state;
        routeNode = routeNode.children.find((child) => child.route === route.name);
    }
    return { params, routeNode, state: initialState };
}
const displayWarningForProp = (prop) => {
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`navigation.${prop} should not be used in a previewed screen. To fix this issue, wrap navigation calls with 'if (!isPreview) { ... }'.`);
    }
};
const createNOOPWithWarning = (prop) => () => displayWarningForProp(prop);
const navigationPropWithWarnings = {
    setParams: createNOOPWithWarning('setParams'),
    setOptions: createNOOPWithWarning('setOptions'),
    addListener: (() => () => { }),
    removeListener: () => { },
    isFocused: () => true,
    canGoBack: () => false,
    dispatch: createNOOPWithWarning('dispatch'),
    navigate: createNOOPWithWarning('navigate'),
    goBack: createNOOPWithWarning('goBack'),
    reset: createNOOPWithWarning('reset'),
    push: createNOOPWithWarning('push'),
    pop: createNOOPWithWarning('pop'),
    popToTop: createNOOPWithWarning('popToTop'),
    navigateDeprecated: createNOOPWithWarning('navigateDeprecated'),
    preload: createNOOPWithWarning('preload'),
    getId: () => {
        displayWarningForProp('getId');
        return '';
    },
    // @ts-expect-error
    getParent: createNOOPWithWarning('getParent'),
    getState: () => {
        displayWarningForProp('getState');
        return {
            key: '',
            index: 0,
            routeNames: [],
            routes: [],
            type: 'stack',
            stale: false,
        };
    },
};
//# sourceMappingURL=HrefPreview.js.map