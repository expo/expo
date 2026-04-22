"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDrawerNavigator = createDrawerNavigator;
const jsx_runtime_1 = require("react/jsx-runtime");
const native_1 = require("../../native");
const DrawerView_1 = require("../views/DrawerView");
function DrawerNavigator({ id, initialRouteName, defaultStatus = 'closed', backBehavior, UNSTABLE_routeNamesChangeBehavior, children, layout, screenListeners, screenOptions, screenLayout, UNSTABLE_router, ...rest }) {
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(native_1.DrawerRouter, {
        id,
        initialRouteName,
        defaultStatus,
        backBehavior,
        UNSTABLE_routeNamesChangeBehavior,
        children,
        layout,
        screenListeners,
        screenOptions,
        screenLayout,
        UNSTABLE_router,
    });
    return ((0, jsx_runtime_1.jsx)(NavigationContent, { children: (0, jsx_runtime_1.jsx)(DrawerView_1.DrawerView, { ...rest, defaultStatus: defaultStatus, state: state, descriptors: descriptors, navigation: navigation }) }));
}
function createDrawerNavigator(config) {
    return (0, native_1.createNavigatorFactory)(DrawerNavigator)(config);
}
//# sourceMappingURL=createDrawerNavigator.js.map