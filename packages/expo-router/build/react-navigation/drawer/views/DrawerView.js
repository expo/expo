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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DrawerView = DrawerView;
const jsx_runtime_1 = require("react/jsx-runtime");
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_drawer_layout_1 = require("react-native-drawer-layout");
const useLatestCallback_1 = __importDefault(require("../../../utils/useLatestCallback"));
const native_1 = require("../../native");
const DrawerContent_1 = require("./DrawerContent");
const DrawerToggleButton_1 = require("./DrawerToggleButton");
const ScreenFallback_1 = require("./ScreenFallback");
const elements_1 = require("../../elements");
const DrawerPositionContext_1 = require("../utils/DrawerPositionContext");
const DrawerStatusContext_1 = require("../utils/DrawerStatusContext");
const addCancelListener_1 = require("../utils/addCancelListener");
const DRAWER_BORDER_RADIUS = 16;
const renderDrawerContentDefault = (props) => ((0, jsx_runtime_1.jsx)(DrawerContent_1.DrawerContent, { ...props }));
function DrawerViewBase({ state, descriptors, defaultStatus, drawerStatus, preloadedRouteKeys, navigatorKey, isFocused, emit, navigate, goBack, openDrawer: openDrawerAction, closeDrawer: closeDrawerAction, toggleDrawer, handlePopToTopOnBlur, drawerContent = renderDrawerContentDefault, detachInactiveScreens = react_native_1.Platform.OS === 'web' ||
    react_native_1.Platform.OS === 'android' ||
    react_native_1.Platform.OS === 'ios', }) {
    const { direction } = (0, native_1.useLocale)();
    const focusedRouteKey = state.routes[state.index].key;
    const { drawerHideStatusBarOnOpen, drawerPosition = direction === 'rtl' ? 'right' : 'left', drawerStatusBarAnimation, drawerStyle, drawerType = react_native_1.Platform.select({ ios: 'slide', default: 'front' }), configureGestureHandler, keyboardDismissMode, overlayColor = 'rgba(0, 0, 0, 0.5)', swipeEdgeWidth, swipeEnabled = react_native_1.Platform.OS !== 'web' && react_native_1.Platform.OS !== 'windows' && react_native_1.Platform.OS !== 'macos', swipeMinDistance, overlayAccessibilityLabel, } = descriptors[focusedRouteKey].options;
    const [loaded, setLoaded] = React.useState([focusedRouteKey]);
    if (!loaded.includes(focusedRouteKey)) {
        setLoaded([...loaded, focusedRouteKey]);
    }
    const previousRouteKeyRef = React.useRef(focusedRouteKey);
    React.useEffect(() => {
        const previousRouteKey = previousRouteKeyRef.current;
        if (previousRouteKey !== focusedRouteKey &&
            descriptors[previousRouteKey]?.options.popToTopOnBlur) {
            handlePopToTopOnBlur(previousRouteKey);
        }
        previousRouteKeyRef.current = focusedRouteKey;
    }, [descriptors, focusedRouteKey, handlePopToTopOnBlur]);
    const dimensions = (0, elements_1.useFrameSize)((size) => size, true);
    const { colors } = (0, native_1.useTheme)();
    const handleDrawerOpen = (0, useLatestCallback_1.default)(() => {
        openDrawerAction();
    });
    const handleDrawerClose = (0, useLatestCallback_1.default)(() => {
        closeDrawerAction();
    });
    const handleGestureStart = (0, useLatestCallback_1.default)(() => {
        emit({
            type: 'gestureStart',
            target: navigatorKey,
        });
    });
    const handleGestureEnd = (0, useLatestCallback_1.default)(() => {
        emit({
            type: 'gestureEnd',
            target: navigatorKey,
        });
    });
    const handleGestureCancel = (0, useLatestCallback_1.default)(() => {
        emit({
            type: 'gestureCancel',
            target: navigatorKey,
        });
    });
    const handleTransitionStart = (0, useLatestCallback_1.default)((closing) => {
        emit({
            type: 'transitionStart',
            data: { closing },
            target: navigatorKey,
        });
    });
    const handleTransitionEnd = (0, useLatestCallback_1.default)((closing) => {
        emit({
            type: 'transitionEnd',
            data: { closing },
            target: navigatorKey,
        });
    });
    React.useEffect(() => {
        if (drawerStatus === defaultStatus || drawerType === 'permanent') {
            return;
        }
        const handleHardwareBack = () => {
            // We shouldn't handle the back button if the parent screen isn't focused
            // This will avoid the drawer overriding event listeners from a focused screen
            if (!isFocused()) {
                return false;
            }
            if (defaultStatus === 'open') {
                handleDrawerOpen();
            }
            else {
                handleDrawerClose();
            }
            return true;
        };
        // We only add the listeners when drawer opens
        // This way we can make sure that the listener is added as late as possible
        // This will make sure that our handler will run first when back button is pressed
        return (0, addCancelListener_1.addCancelListener)(handleHardwareBack);
    }, [defaultStatus, drawerStatus, drawerType, handleDrawerClose, handleDrawerOpen, isFocused]);
    const renderDrawerContent = () => {
        return ((0, jsx_runtime_1.jsx)(DrawerPositionContext_1.DrawerPositionContext.Provider, { value: drawerPosition, children: drawerContent({
                state,
                descriptors,
                isFocused,
                emit,
                navigate,
                goBack,
                openDrawer: openDrawerAction,
                closeDrawer: closeDrawerAction,
                toggleDrawer,
            }) }));
    };
    const renderSceneContent = () => {
        return ((0, jsx_runtime_1.jsx)(ScreenFallback_1.MaybeScreenContainer, { enabled: detachInactiveScreens, hasTwoStates: true, style: styles.content, children: state.routes.map((route, index) => {
                const descriptor = descriptors[route.key];
                const { lazy = true } = descriptor.options;
                const isFocusedRoute = state.index === index;
                const isPreloaded = preloadedRouteKeys.includes(route.key);
                if (lazy && !loaded.includes(route.key) && !isFocusedRoute && !isPreloaded) {
                    // Don't render a lazy screen if we've never navigated to it or it wasn't preloaded
                    return null;
                }
                const { freezeOnBlur, header = ({ layout, options }) => ((0, jsx_runtime_1.jsx)(elements_1.Header, { ...options, layout: layout, title: (0, elements_1.getHeaderTitle)(options, route.name), headerLeft: drawerPosition === 'left' && options.headerLeft == null
                        ? (props) => (0, jsx_runtime_1.jsx)(DrawerToggleButton_1.DrawerToggleButton, { ...props })
                        : options.headerLeft, headerRight: drawerPosition === 'right' && options.headerRight == null
                        ? (props) => (0, jsx_runtime_1.jsx)(DrawerToggleButton_1.DrawerToggleButton, { ...props })
                        : options.headerRight })), headerShown, headerStatusBarHeight, headerTransparent, sceneStyle, } = descriptor.options;
                return ((0, jsx_runtime_1.jsx)(ScreenFallback_1.MaybeScreen, { style: [react_native_1.StyleSheet.absoluteFill, { zIndex: isFocusedRoute ? 0 : -1 }], visible: isFocusedRoute, enabled: detachInactiveScreens, freezeOnBlur: freezeOnBlur, shouldFreeze: !isFocusedRoute && !isPreloaded, children: (0, jsx_runtime_1.jsx)(elements_1.Screen, { focused: isFocusedRoute, route: descriptor.route, navigation: descriptor.navigation, headerShown: headerShown, headerStatusBarHeight: headerStatusBarHeight, headerTransparent: headerTransparent, header: header({
                            layout: dimensions,
                            route: descriptor.route,
                            navigation: descriptor.navigation,
                            options: descriptor.options,
                        }), style: sceneStyle, children: descriptor.render() }) }, route.key));
            }) }));
    };
    return ((0, jsx_runtime_1.jsx)(DrawerStatusContext_1.DrawerStatusContext.Provider, { value: drawerStatus, children: (0, jsx_runtime_1.jsx)(react_native_drawer_layout_1.Drawer, { open: drawerStatus !== 'closed', onOpen: handleDrawerOpen, onClose: handleDrawerClose, onGestureStart: handleGestureStart, onGestureEnd: handleGestureEnd, onGestureCancel: handleGestureCancel, onTransitionStart: handleTransitionStart, onTransitionEnd: handleTransitionEnd, layout: dimensions, direction: direction, configureGestureHandler: configureGestureHandler, swipeEnabled: swipeEnabled, swipeEdgeWidth: swipeEdgeWidth, swipeMinDistance: swipeMinDistance, hideStatusBarOnOpen: drawerHideStatusBarOnOpen, statusBarAnimation: drawerStatusBarAnimation, keyboardDismissMode: keyboardDismissMode, drawerType: drawerType, overlayAccessibilityLabel: overlayAccessibilityLabel, drawerPosition: drawerPosition, drawerStyle: [
                { backgroundColor: colors.card },
                drawerType === 'permanent' &&
                    ((react_native_1.Platform.OS === 'web'
                        ? drawerPosition === 'right'
                        : (direction === 'rtl' && drawerPosition !== 'right') ||
                            (direction !== 'rtl' && drawerPosition === 'right'))
                        ? {
                            borderLeftColor: colors.border,
                            borderLeftWidth: react_native_1.StyleSheet.hairlineWidth,
                        }
                        : {
                            borderRightColor: colors.border,
                            borderRightWidth: react_native_1.StyleSheet.hairlineWidth,
                        }),
                drawerType === 'front' &&
                    (drawerPosition === 'left'
                        ? {
                            borderTopRightRadius: DRAWER_BORDER_RADIUS,
                            borderBottomRightRadius: DRAWER_BORDER_RADIUS,
                        }
                        : {
                            borderTopLeftRadius: DRAWER_BORDER_RADIUS,
                            borderBottomLeftRadius: DRAWER_BORDER_RADIUS,
                        }),
                drawerStyle,
            ], overlayStyle: { backgroundColor: overlayColor }, renderDrawerContent: renderDrawerContent, children: renderSceneContent() }) }));
}
function DrawerView(props) {
    return ((0, jsx_runtime_1.jsx)(elements_1.SafeAreaProviderCompat, { children: (0, jsx_runtime_1.jsx)(DrawerViewBase, { ...props }) }));
}
const styles = react_native_1.StyleSheet.create({
    content: {
        flex: 1,
    },
});
//# sourceMappingURL=DrawerView.js.map