"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBottomTabNavigator = createBottomTabNavigator;
const jsx_runtime_1 = require("react/jsx-runtime");
const native_1 = require("../../native");
const BottomTabView_1 = require("../views/BottomTabView");
function BottomTabNavigator({ id, initialRouteName, backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.TabRouter, {
        id,
        initialRouteName,
        backBehavior,
        UNSTABLE_routeNamesChangeBehavior,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
    });
    return ((0, jsx_runtime_1.jsx)(NavigationContent, { children: (0, jsx_runtime_1.jsx)(BottomTabView_1.BottomTabView, { ...rest, state: state, navigation: navigation, descriptors: descriptors }) }));
}
function createBottomTabNavigator(config) {
    return (0, native_1.createNavigatorFactory)(BottomTabNavigator)(config);
}
//# sourceMappingURL=createBottomTabNavigator.js.map