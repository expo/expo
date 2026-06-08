"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerItemList = DrawerItemList;
const jsx_runtime_1 = require("react/jsx-runtime");
const native_1 = require("../../native");
const DrawerItem_1 = require("./DrawerItem");
/**
 * Component that renders the navigation list in the drawer.
 */
function DrawerItemList({ state, navigation, descriptors }) {
    const { buildHref } = (0, native_1.useLinkBuilder)();
    const focusedRoute = state.routes[state.index];
    const focusedDescriptor = descriptors[focusedRoute.key];
    const focusedOptions = focusedDescriptor.options;
    const { drawerActiveTintColor, drawerInactiveTintColor, drawerActiveBackgroundColor, drawerInactiveBackgroundColor, } = focusedOptions;
    return state.routes.map((route, i) => {
        const focused = i === state.index;
        const onPress = () => {
            const event = navigation.emit({
                type: 'drawerItemPress',
                target: route.key,
                canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
                navigation.dispatch({
                    ...(focused ? native_1.DrawerActions.closeDrawer() : native_1.CommonActions.navigate(route)),
                    target: state.key,
                });
            }
        };
        const { title, drawerLabel, drawerIcon, drawerLabelStyle, drawerItemStyle, drawerAllowFontScaling, } = descriptors[route.key].options;
        return ((0, jsx_runtime_1.jsx)(DrawerItem_1.DrawerItem, { route: route, href: buildHref(route.name, route.params), label: drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name, icon: drawerIcon, focused: focused, activeTintColor: drawerActiveTintColor, inactiveTintColor: drawerInactiveTintColor, activeBackgroundColor: drawerActiveBackgroundColor, inactiveBackgroundColor: drawerInactiveBackgroundColor, allowFontScaling: drawerAllowFontScaling, labelStyle: drawerLabelStyle, style: drawerItemStyle, onPress: onPress }, route.key));
    });
}
//# sourceMappingURL=DrawerItemList.js.map