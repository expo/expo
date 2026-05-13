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
exports.getTabBarHeight = void 0;
exports.BottomTabBar = BottomTabBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const BottomTabItem_1 = require("./BottomTabItem");
const elements_1 = require("../../elements");
const native_1 = require("../../native");
const BottomTabBarHeightCallbackContext_1 = require("../utils/BottomTabBarHeightCallbackContext");
const useIsKeyboardShown_1 = require("../utils/useIsKeyboardShown");
const TABBAR_HEIGHT_UIKIT = 49;
const TABBAR_HEIGHT_UIKIT_COMPACT = 32;
const SPACING_UIKIT = 15;
const SPACING_MATERIAL = 12;
const DEFAULT_MAX_TAB_ITEM_WIDTH = 125;
const useNativeDriver = process.env.EXPO_OS !== 'web';
const shouldUseHorizontalLabels = ({ state, descriptors, dimensions }) => {
    const { tabBarLabelPosition } = descriptors[state.routes[state.index].key].options;
    if (tabBarLabelPosition) {
        switch (tabBarLabelPosition) {
            case 'beside-icon':
                return true;
            case 'below-icon':
                return false;
        }
    }
    if (dimensions.width >= 768) {
        // Screen size matches a tablet
        const maxTabWidth = state.routes.reduce((acc, route) => {
            const { tabBarItemStyle } = descriptors[route.key].options;
            const flattenedStyle = react_native_1.StyleSheet.flatten(tabBarItemStyle);
            if (flattenedStyle) {
                if (typeof flattenedStyle.width === 'number') {
                    return acc + flattenedStyle.width;
                }
                else if (typeof flattenedStyle.maxWidth === 'number') {
                    return acc + flattenedStyle.maxWidth;
                }
            }
            return acc + DEFAULT_MAX_TAB_ITEM_WIDTH;
        }, 0);
        return maxTabWidth <= dimensions.width;
    }
    else {
        return dimensions.width > dimensions.height;
    }
};
const isCompact = ({ state, descriptors, dimensions }) => {
    const { tabBarPosition, tabBarVariant } = descriptors[state.routes[state.index].key].options;
    if (tabBarPosition === 'left' || tabBarPosition === 'right' || tabBarVariant === 'material') {
        return false;
    }
    const isLandscape = dimensions.width > dimensions.height;
    const horizontalLabels = shouldUseHorizontalLabels({
        state,
        descriptors,
        dimensions,
    });
    if (react_native_1.Platform.OS === 'ios' && !react_native_1.Platform.isPad && isLandscape && horizontalLabels) {
        return true;
    }
    return false;
};
const getTabBarHeight = ({ state, descriptors, dimensions, insets, style, }) => {
    const { tabBarPosition } = descriptors[state.routes[state.index].key].options;
    const flattenedStyle = react_native_1.StyleSheet.flatten(style);
    const customHeight = flattenedStyle && 'height' in flattenedStyle ? flattenedStyle.height : undefined;
    if (typeof customHeight === 'number') {
        return customHeight;
    }
    const inset = insets[tabBarPosition === 'top' ? 'top' : 'bottom'];
    if (isCompact({ state, descriptors, dimensions })) {
        return TABBAR_HEIGHT_UIKIT_COMPACT + inset;
    }
    return TABBAR_HEIGHT_UIKIT + inset;
};
exports.getTabBarHeight = getTabBarHeight;
function BottomTabBar({ state, navigation, descriptors, insets, style }) {
    const { colors } = (0, native_1.useTheme)();
    const { direction } = (0, native_1.useLocale)();
    const { buildHref } = (0, native_1.useLinkBuilder)();
    const focusedRoute = state.routes[state.index];
    const focusedDescriptor = descriptors[focusedRoute.key];
    const focusedOptions = focusedDescriptor.options;
    const { tabBarPosition = 'bottom', tabBarShowLabel, tabBarLabelPosition, tabBarHideOnKeyboard = false, tabBarVisibilityAnimationConfig, tabBarVariant = 'uikit', tabBarStyle, tabBarBackground, tabBarActiveTintColor, tabBarInactiveTintColor, tabBarActiveBackgroundColor, tabBarInactiveBackgroundColor, } = focusedOptions;
    if (tabBarVariant === 'material' && tabBarPosition !== 'left' && tabBarPosition !== 'right') {
        throw new Error("The 'material' variant for tab bar is only supported when 'tabBarPosition' is set to 'left' or 'right'.");
    }
    if (tabBarLabelPosition === 'below-icon' &&
        tabBarVariant === 'uikit' &&
        (tabBarPosition === 'left' || tabBarPosition === 'right')) {
        throw new Error("The 'below-icon' label position for tab bar is only supported when 'tabBarPosition' is set to 'top' or 'bottom' when using the 'uikit' variant.");
    }
    const isKeyboardShown = (0, useIsKeyboardShown_1.useIsKeyboardShown)();
    const onHeightChange = (0, react_1.use)(BottomTabBarHeightCallbackContext_1.BottomTabBarHeightCallbackContext);
    const shouldShowTabBar = !(tabBarHideOnKeyboard && isKeyboardShown);
    const visibilityAnimationConfigRef = react_1.default.useRef(tabBarVisibilityAnimationConfig);
    react_1.default.useEffect(() => {
        visibilityAnimationConfigRef.current = tabBarVisibilityAnimationConfig;
    });
    const [isTabBarHidden, setIsTabBarHidden] = react_1.default.useState(!shouldShowTabBar);
    const [visible] = react_1.default.useState(() => new react_native_1.Animated.Value(shouldShowTabBar ? 1 : 0));
    react_1.default.useEffect(() => {
        const visibilityAnimationConfig = visibilityAnimationConfigRef.current;
        if (shouldShowTabBar) {
            const animation = visibilityAnimationConfig?.show?.animation === 'spring' ? react_native_1.Animated.spring : react_native_1.Animated.timing;
            animation(visible, {
                toValue: 1,
                useNativeDriver,
                duration: 250,
                ...visibilityAnimationConfig?.show?.config,
            }).start(({ finished }) => {
                if (finished) {
                    setIsTabBarHidden(false);
                }
            });
        }
        else {
            setIsTabBarHidden(true);
            const animation = visibilityAnimationConfig?.hide?.animation === 'spring' ? react_native_1.Animated.spring : react_native_1.Animated.timing;
            animation(visible, {
                toValue: 0,
                useNativeDriver,
                duration: 200,
                ...visibilityAnimationConfig?.hide?.config,
            }).start();
        }
        return () => visible.stopAnimation();
    }, [visible, shouldShowTabBar]);
    const [layout, setLayout] = react_1.default.useState({
        height: 0,
    });
    const handleLayout = (e) => {
        const { height } = e.nativeEvent.layout;
        onHeightChange?.(height);
        setLayout((layout) => {
            if (height === layout.height) {
                return layout;
            }
            else {
                return { height };
            }
        });
    };
    const { routes } = state;
    const tabBarHeight = (0, elements_1.useFrameSize)((dimensions) => (0, exports.getTabBarHeight)({
        state,
        descriptors,
        insets,
        dimensions,
        style: [tabBarStyle, style],
    }));
    const hasHorizontalLabels = (0, elements_1.useFrameSize)((dimensions) => shouldUseHorizontalLabels({
        state,
        descriptors,
        dimensions,
    }));
    const compact = (0, elements_1.useFrameSize)((dimensions) => isCompact({ state, descriptors, dimensions }));
    const sidebar = tabBarPosition === 'left' || tabBarPosition === 'right';
    const spacing = tabBarVariant === 'material' ? SPACING_MATERIAL : SPACING_UIKIT;
    const minSidebarWidth = (0, elements_1.useFrameSize)((size) => sidebar && hasHorizontalLabels ? (0, elements_1.getDefaultSidebarWidth)(size) : 0);
    const tabBarBackgroundElement = tabBarBackground?.();
    return ((0, jsx_runtime_1.jsxs)(react_native_1.Animated.View, { style: [
            { pointerEvents: isTabBarHidden ? 'none' : 'auto' },
            tabBarPosition === 'left'
                ? styles.start
                : tabBarPosition === 'right'
                    ? styles.end
                    : styles.bottom,
            (process.env.EXPO_OS === 'web'
                ? tabBarPosition === 'right'
                : (direction === 'rtl' && tabBarPosition === 'left') ||
                    (direction !== 'rtl' && tabBarPosition === 'right'))
                ? { borderLeftWidth: react_native_1.StyleSheet.hairlineWidth }
                : (process.env.EXPO_OS === 'web'
                    ? tabBarPosition === 'left'
                    : (direction === 'rtl' && tabBarPosition === 'right') ||
                        (direction !== 'rtl' && tabBarPosition === 'left'))
                    ? { borderRightWidth: react_native_1.StyleSheet.hairlineWidth }
                    : tabBarPosition === 'top'
                        ? { borderBottomWidth: react_native_1.StyleSheet.hairlineWidth }
                        : { borderTopWidth: react_native_1.StyleSheet.hairlineWidth },
            {
                backgroundColor: tabBarBackgroundElement != null ? 'transparent' : colors.card,
                borderColor: colors.border,
            },
            sidebar
                ? {
                    paddingTop: (hasHorizontalLabels ? spacing : spacing / 2) + insets.top,
                    paddingBottom: (hasHorizontalLabels ? spacing : spacing / 2) + insets.bottom,
                    paddingStart: spacing + (tabBarPosition === 'left' ? insets.left : 0),
                    paddingEnd: spacing + (tabBarPosition === 'right' ? insets.right : 0),
                    minWidth: minSidebarWidth,
                }
                : [
                    {
                        transform: [
                            {
                                translateY: visible.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [
                                        layout.height +
                                            insets[tabBarPosition === 'top' ? 'top' : 'bottom'] +
                                            react_native_1.StyleSheet.hairlineWidth,
                                        0,
                                    ],
                                }),
                            },
                        ],
                        // Absolutely position the tab bar so that the content is below it
                        // This is needed to avoid gap at bottom when the tab bar is hidden
                        position: isTabBarHidden ? 'absolute' : undefined,
                    },
                    {
                        height: tabBarHeight,
                        paddingBottom: tabBarPosition === 'bottom' ? insets.bottom : 0,
                        paddingTop: tabBarPosition === 'top' ? insets.top : 0,
                        paddingHorizontal: Math.max(insets.left, insets.right),
                    },
                ],
            tabBarStyle,
        ], onLayout: sidebar ? undefined : handleLayout, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [react_native_1.StyleSheet.absoluteFill, styles.pointerEventsNone], children: tabBarBackgroundElement }), (0, jsx_runtime_1.jsx)(react_native_1.View, { role: "tablist", style: sidebar ? styles.sideContent : styles.bottomContent, children: routes.map((route, index) => {
                    const focused = index === state.index;
                    const { options } = descriptors[route.key];
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });
                        if (!focused && !event.defaultPrevented) {
                            navigation.dispatch({
                                ...native_1.CommonActions.navigate(route),
                                target: state.key,
                            });
                        }
                    };
                    const onLongPress = () => {
                        navigation.emit({
                            type: 'tabLongPress',
                            target: route.key,
                        });
                    };
                    const label = typeof options.tabBarLabel === 'function'
                        ? options.tabBarLabel
                        : (0, elements_1.getLabel)({ label: options.tabBarLabel, title: options.title }, route.name);
                    const accessibilityLabel = options.tabBarAccessibilityLabel !== undefined
                        ? options.tabBarAccessibilityLabel
                        : typeof label === 'string' && process.env.EXPO_OS === 'ios'
                            ? `${label}, tab, ${index + 1} of ${routes.length}`
                            : undefined;
                    return ((0, jsx_runtime_1.jsx)(native_1.NavigationProvider, { route: route, navigation: descriptors[route.key].navigation, children: (0, jsx_runtime_1.jsx)(BottomTabItem_1.BottomTabItem, { href: buildHref(route.name, route.params), route: route, descriptor: descriptors[route.key], focused: focused, horizontal: hasHorizontalLabels, compact: compact, sidebar: sidebar, variant: tabBarVariant, onPress: onPress, onLongPress: onLongPress, accessibilityLabel: accessibilityLabel, testID: options.tabBarButtonTestID, allowFontScaling: options.tabBarAllowFontScaling, activeTintColor: tabBarActiveTintColor, inactiveTintColor: tabBarInactiveTintColor, activeBackgroundColor: tabBarActiveBackgroundColor, inactiveBackgroundColor: tabBarInactiveBackgroundColor, button: options.tabBarButton, icon: options.tabBarIcon ??
                                (({ color, size }) => (0, jsx_runtime_1.jsx)(elements_1.MissingIcon, { color: color, size: size })), badge: options.tabBarBadge, badgeStyle: options.tabBarBadgeStyle, label: label, showLabel: tabBarShowLabel, labelStyle: options.tabBarLabelStyle, iconStyle: options.tabBarIconStyle, style: [
                                sidebar
                                    ? {
                                        marginVertical: hasHorizontalLabels
                                            ? tabBarVariant === 'material'
                                                ? 0
                                                : 1
                                            : spacing / 2,
                                    }
                                    : styles.bottomItem,
                                options.tabBarItemStyle,
                            ] }) }, route.key));
                }) })] }));
}
const styles = react_native_1.StyleSheet.create({
    start: {
        top: 0,
        bottom: 0,
        start: 0,
    },
    end: {
        top: 0,
        bottom: 0,
        end: 0,
    },
    bottom: {
        start: 0,
        end: 0,
        bottom: 0,
        elevation: 8,
    },
    bottomContent: {
        flex: 1,
        flexDirection: 'row',
    },
    sideContent: {
        flex: 1,
        flexDirection: 'column',
    },
    bottomItem: {
        flex: 1,
    },
    pointerEventsNone: {
        pointerEvents: 'none',
    },
});
//# sourceMappingURL=BottomTabBar.js.map