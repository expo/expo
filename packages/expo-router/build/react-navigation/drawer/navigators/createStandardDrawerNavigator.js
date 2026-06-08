"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStandardDrawerNavigator = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const standard_navigation_1 = require("standard-navigation");
const DrawerView_1 = require("../views/DrawerView");
function DrawerNavigatorContent({ state, descriptors, actions, emitter, drawerStatus, preloadedRouteKeys, navigatorKey, isFocused, openDrawer, closeDrawer, toggleDrawer, handlePopToTopOnBlur, defaultStatus = 'closed', drawerContent, detachInactiveScreens, }) {
    // The standard contract narrows descriptors to `{ options, render }`, but the integration layer forwards
    // the real react-navigation drawer descriptors at runtime, so headers/screens can read `.navigation`/`.route`.
    const drawerDescriptors = descriptors;
    // These are always supplied by `DrawerClient`'s `createProps`; they are optional on the public component
    // only so the user is not forced to pass them. The `!` assertions reflect that runtime guarantee.
    return ((0, jsx_runtime_1.jsx)(DrawerView_1.DrawerView, { state: state, descriptors: drawerDescriptors, defaultStatus: defaultStatus, drawerStatus: drawerStatus, preloadedRouteKeys: preloadedRouteKeys, navigatorKey: navigatorKey, drawerContent: drawerContent, detachInactiveScreens: detachInactiveScreens, emit: emitter.emit, isFocused: isFocused, navigate: actions.navigate, goBack: actions.back, openDrawer: openDrawer, closeDrawer: closeDrawer, toggleDrawer: toggleDrawer, handlePopToTopOnBlur: handlePopToTopOnBlur }));
}
exports.createStandardDrawerNavigator = (0, standard_navigation_1.createStandardNavigator)(DrawerNavigatorContent);
//# sourceMappingURL=createStandardDrawerNavigator.js.map