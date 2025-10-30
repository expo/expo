"use strict";
'use client';
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
exports.NativeTabsNavigatorWithContext = exports.NativeTabsContext = void 0;
exports.NativeTabsNavigator = NativeTabsNavigator;
const native_1 = require("@react-navigation/native");
const react_1 = __importStar(require("react"));
const NativeBottomTabsRouter_1 = require("./NativeBottomTabsRouter");
const NativeTabsView_1 = require("./NativeTabsView");
const __1 = require("../..");
const utils_1 = require("./utils");
const linking_1 = require("../../link/linking");
// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
exports.NativeTabsContext = react_1.default.createContext(false);
function NativeTabsNavigator({ children, backBehavior = defaultBackBehavior, labelStyle, iconColor, blurEffect, backgroundColor, badgeBackgroundColor, indicatorColor, badgeTextColor, ...rest }) {
    if ((0, react_1.use)(exports.NativeTabsContext)) {
        throw new Error('Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.');
    }
    const processedLabelStyle = (0, utils_1.convertLabelStylePropToObject)(labelStyle);
    const processedIconColor = (0, utils_1.convertIconColorPropToObject)(iconColor);
    const selectedLabelStyle = processedLabelStyle.selected
        ? {
            ...processedLabelStyle.selected,
            color: processedLabelStyle.selected.color ?? rest.tintColor,
        }
        : rest.tintColor
            ? { color: rest.tintColor }
            : undefined;
    const { state, descriptors, navigation, NavigationContent } = (0, native_1.useNavigationBuilder)(NativeBottomTabsRouter_1.NativeBottomTabsRouter, {
        children,
        backBehavior,
        screenOptions: {
            disableTransparentOnScrollEdge: rest.disableTransparentOnScrollEdge,
            labelStyle: processedLabelStyle.default,
            selectedLabelStyle,
            iconColor: processedIconColor.default,
            selectedIconColor: processedIconColor.selected ?? rest.tintColor,
            blurEffect,
            backgroundColor,
            badgeBackgroundColor,
            indicatorColor,
            badgeTextColor,
        },
    });
    const { routes } = state;
    const visibleTabs = (0, react_1.useMemo)(() => routes
        // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
        // If it is not defined, then it was not specified, and we should hide the tab.
        .filter((route) => descriptors[route.key].options?.hidden !== true)
        .map((route) => ({
        options: descriptors[route.key].options,
        routeKey: route.key,
        name: route.name,
        contentRenderer: () => descriptors[route.key].render(),
    })), [routes, descriptors]);
    const visibleFocusedTabIndex = (0, react_1.useMemo)(() => visibleTabs.findIndex((tab) => tab.routeKey === routes[state.index].key), [visibleTabs, routes, state.index]);
    if (visibleFocusedTabIndex < 0) {
        if (process.env.NODE_ENV !== 'production') {
            throw new Error(`The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${(0, linking_1.getPathFromState)(state)}"`);
        }
    }
    const focusedIndex = visibleFocusedTabIndex >= 0 ? visibleFocusedTabIndex : 0;
    const onTabChange = (0, react_1.useCallback)((tabKey) => {
        const descriptor = descriptors[tabKey];
        const route = descriptor.route;
        navigation.dispatch({
            type: 'JUMP_TO',
            target: state.key,
            payload: {
                name: route.name,
            },
        });
    }, [descriptors, navigation, state.key]);
    return (<NavigationContent>
      <exports.NativeTabsContext value>
        <NativeTabsView_1.NativeTabsView {...rest} focusedIndex={focusedIndex} tabs={visibleTabs} onTabChange={onTabChange}/>
      </exports.NativeTabsContext>
    </NavigationContent>);
}
const createNativeTabNavigator = (0, native_1.createNavigatorFactory)(NativeTabsNavigator);
exports.NativeTabsNavigatorWithContext = (0, __1.withLayoutContext)(createNativeTabNavigator().Navigator, undefined, true);
//# sourceMappingURL=NativeBottomTabsNavigator.js.map