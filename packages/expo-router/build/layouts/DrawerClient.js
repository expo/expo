"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = void 0;
const drawer_1 = require("../react-navigation/drawer");
const native_1 = require("../react-navigation/native");
const standard_navigation_1 = require("../standard-navigation");
exports.Drawer = (0, standard_navigation_1.unstable_integrateWithRouter)(drawer_1.createStandardDrawerNavigator, native_1.DrawerRouter, {
    createProps: ({ state, dispatch, navigation }) => {
        const target = state.key;
        return {
            drawerStatus: (0, drawer_1.getDrawerStatusFromState)(state),
            preloadedRouteKeys: state.preloadedRouteKeys,
            navigatorKey: state.key,
            isFocused: navigation.isFocused,
            openDrawer: () => dispatch({ ...native_1.DrawerActions.openDrawer(), target }),
            closeDrawer: () => dispatch({ ...native_1.DrawerActions.closeDrawer(), target }),
            toggleDrawer: () => dispatch({ ...native_1.DrawerActions.toggleDrawer(), target }),
            handlePopToTopOnBlur: (routeKey) => {
                const route = state.routes.find((r) => r.key === routeKey);
                if (route?.state?.type === 'stack' && route.state.key) {
                    dispatch({ ...native_1.StackActions.popToTop(), target: route.state.key });
                }
            },
        };
    },
});
exports.default = exports.Drawer;
//# sourceMappingURL=DrawerClient.js.map