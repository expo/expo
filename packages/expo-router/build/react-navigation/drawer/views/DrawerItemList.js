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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerItemList = DrawerItemList;
const React = __importStar(require("react"));
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
        return (<DrawerItem_1.DrawerItem key={route.key} route={route} href={buildHref(route.name, route.params)} label={drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name} icon={drawerIcon} focused={focused} activeTintColor={drawerActiveTintColor} inactiveTintColor={drawerInactiveTintColor} activeBackgroundColor={drawerActiveBackgroundColor} inactiveBackgroundColor={drawerInactiveBackgroundColor} allowFontScaling={drawerAllowFontScaling} labelStyle={drawerLabelStyle} style={drawerItemStyle} onPress={onPress}/>);
    });
}
//# sourceMappingURL=DrawerItemList.js.map