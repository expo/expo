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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeBottomTabView = NativeBottomTabView;
const color_1 = __importDefault(require("color"));
const React = __importStar(require("react"));
const react_native_1 = require("react-native");
const react_native_screens_1 = require("react-native-screens");
const elements_1 = require("../../elements");
const NativeScreen_1 = require("./NativeScreen/NativeScreen");
const native_1 = require("../../native");
const meta = {
    type: 'native-tabs',
};
function NativeBottomTabView({ state, navigation, descriptors }) {
    const { dark, colors, fonts } = (0, native_1.useTheme)();
    const focusedRouteKey = state.routes[state.index].key;
    const previousRouteKeyRef = React.useRef(focusedRouteKey);
    React.useEffect(() => {
        const previousRouteKey = previousRouteKeyRef.current;
        if (previousRouteKey !== focusedRouteKey &&
            descriptors[previousRouteKey]?.options.popToTopOnBlur) {
            const prevRoute = state.routes.find((route) => route.key === previousRouteKey);
            if (prevRoute?.state?.type === 'stack' && prevRoute.state.key) {
                const popToTopAction = {
                    ...native_1.StackActions.popToTop(),
                    target: prevRoute.state.key,
                };
                navigation.dispatch(popToTopAction);
            }
        }
        previousRouteKeyRef.current = focusedRouteKey;
    }, [descriptors, focusedRouteKey, navigation, state.index, state.routes]);
    const currentOptions = descriptors[state.routes[state.index].key]?.options;
    const { fontFamily = react_native_1.Platform.select({
        ios: fonts.medium.fontFamily,
        default: fonts.regular.fontFamily,
    }), fontWeight = react_native_1.Platform.select({
        ios: fonts.medium.fontWeight,
        default: fonts.regular.fontWeight,
    }), fontSize, fontStyle, color: fontColor, } = currentOptions.tabBarLabelStyle || {};
    const activeTintColor = currentOptions.tabBarActiveTintColor ?? colors.primary;
    const inactiveTintColor = currentOptions.tabBarInactiveTintColor ??
        react_native_1.Platform.select({
            ios: (0, react_native_1.PlatformColor)('label'),
            default: colors.text,
        });
    const activeIndicatorColor = (currentOptions?.tabBarActiveIndicatorColor ?? typeof activeTintColor === 'string')
        ? (0, color_1.default)(activeTintColor)?.alpha(0.1).string()
        : undefined;
    const onTransitionStart = ({ closing, route }) => {
        navigation.emit({
            type: 'transitionStart',
            data: { closing },
            target: route.key,
        });
    };
    const onTransitionEnd = ({ closing, route }) => {
        navigation.emit({
            type: 'transitionEnd',
            data: { closing },
            target: route.key,
        });
    };
    const tabBarControllerMode = currentOptions.tabBarControllerMode === 'auto'
        ? 'automatic'
        : currentOptions.tabBarControllerMode;
    const tabBarMinimizeBehavior = currentOptions.tabBarMinimizeBehavior === 'auto'
        ? 'automatic'
        : currentOptions.tabBarMinimizeBehavior;
    const shouldHideTabBar = currentOptions.tabBarStyle?.display === 'none';
    const bottomAccessory = currentOptions.bottomAccessory;
    return (<elements_1.SafeAreaProviderCompat>
      <react_native_screens_1.Tabs.Host bottomAccessory={bottomAccessory ? (environment) => bottomAccessory({ placement: environment }) : undefined} tabBarHidden={shouldHideTabBar} tabBarItemLabelVisibilityMode={currentOptions?.tabBarLabelVisibilityMode} tabBarControllerMode={tabBarControllerMode} tabBarMinimizeBehavior={tabBarMinimizeBehavior} tabBarTintColor={activeTintColor} tabBarItemIconColor={inactiveTintColor} tabBarItemIconColorActive={activeTintColor} tabBarItemTitleFontColor={inactiveTintColor ?? fontColor} tabBarItemTitleFontColorActive={activeTintColor} tabBarItemTitleFontFamily={fontFamily} tabBarItemTitleFontWeight={fontWeight} tabBarItemTitleFontSize={fontSize} tabBarItemTitleFontSizeActive={fontSize} tabBarItemTitleFontStyle={fontStyle} tabBarBackgroundColor={currentOptions.tabBarStyle?.backgroundColor ?? colors.card} tabBarItemActiveIndicatorColor={activeIndicatorColor} tabBarItemActiveIndicatorEnabled={currentOptions?.tabBarActiveIndicatorEnabled} tabBarItemRippleColor={currentOptions?.tabBarRippleColor} experimentalControlNavigationStateInJS={false} onNativeFocusChange={(e) => {
            const route = state.routes.find((route) => route.key === e.nativeEvent.tabKey);
            if (route) {
                navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                });
                const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
                if (!isFocused) {
                    navigation.dispatch({
                        ...native_1.CommonActions.navigate(route.name, route.params),
                        target: state.key,
                    });
                }
            }
        }}>
        {state.routes.map((route, index) => {
            const { options, render, navigation } = descriptors[route.key];
            const isFocused = state.index === index;
            const isPreloaded = state.preloadedRouteKeys.includes(route.key);
            const { title, lazy = true, tabBarLabel, tabBarBadgeStyle, tabBarIcon, tabBarBadge, tabBarSystemItem, tabBarBlurEffect = dark ? 'systemMaterialDark' : 'systemMaterial', tabBarStyle, overrideScrollViewContentInsetAdjustmentBehavior, } = options;
            const { backgroundColor: tabBarBackgroundColor, shadowColor: tabBarShadowColor } = tabBarStyle || {};
            const tabTitle = 
            // On iOS, `systemItem` already provides a localized label
            // So we should only use `tabBarLabel` if explicitly provided
            react_native_1.Platform.OS === 'ios' && tabBarSystemItem != null
                ? tabBarLabel
                : (0, elements_1.getLabel)({ label: tabBarLabel, title }, route.name);
            const badgeBackgroundColor = tabBarBadgeStyle?.backgroundColor ?? colors.notification;
            const badgeTextColor = tabBarBadgeStyle?.color ??
                (typeof badgeBackgroundColor === 'string'
                    ? (0, color_1.default)(badgeBackgroundColor).isLight()
                        ? 'black'
                        : 'white'
                    : undefined);
            const tabItemAppearance = {
                tabBarItemTitleFontFamily: fontFamily,
                tabBarItemTitleFontSize: fontSize,
                tabBarItemTitleFontWeight: fontWeight,
                tabBarItemTitleFontStyle: fontStyle,
                tabBarItemTitleFontColor: inactiveTintColor ?? fontColor,
                tabBarItemIconColor: inactiveTintColor,
                tabBarItemBadgeBackgroundColor: badgeBackgroundColor,
            };
            const icon = typeof tabBarIcon === 'function'
                ? getPlatformIcon(tabBarIcon({ focused: false }))
                : tabBarIcon != null
                    ? getPlatformIcon(tabBarIcon)
                    : undefined;
            const selectedIcon = typeof tabBarIcon === 'function'
                ? getPlatformIcon(tabBarIcon({ focused: true }))
                : undefined;
            return (<react_native_screens_1.Tabs.Screen onWillDisappear={() => onTransitionStart({ closing: true, route })} onWillAppear={() => onTransitionStart({ closing: false, route })} onDidAppear={() => onTransitionEnd({ closing: false, route })} onDidDisappear={() => onTransitionEnd({ closing: true, route })} key={route.key} tabKey={route.key} icon={icon} selectedIcon={selectedIcon?.ios ?? selectedIcon?.shared} tabBarItemBadgeBackgroundColor={badgeBackgroundColor} tabBarItemBadgeTextColor={badgeTextColor} badgeValue={tabBarBadge?.toString()} systemItem={tabBarSystemItem} isFocused={isFocused} title={tabTitle} scrollEdgeAppearance={{
                    tabBarBackgroundColor,
                    tabBarShadowColor,
                    tabBarBlurEffect,
                    stacked: {
                        normal: tabItemAppearance,
                    },
                    inline: {
                        normal: tabItemAppearance,
                    },
                    compactInline: {
                        normal: tabItemAppearance,
                    },
                }} standardAppearance={{
                    tabBarBackgroundColor,
                    tabBarShadowColor,
                    tabBarBlurEffect,
                    stacked: {
                        normal: tabItemAppearance,
                    },
                    inline: {
                        normal: tabItemAppearance,
                    },
                    compactInline: {
                        normal: tabItemAppearance,
                    },
                }} specialEffects={{
                    repeatedTabSelection: {
                        popToRoot: true,
                        scrollToTop: true,
                    },
                }} overrideScrollViewContentInsetAdjustmentBehavior={overrideScrollViewContentInsetAdjustmentBehavior} experimental_userInterfaceStyle={dark ? 'dark' : 'light'}>
              <elements_1.Lazy enabled={lazy} visible={isFocused || isPreloaded}>
                <ScreenWithHeader isFocused={isFocused} route={route} navigation={navigation} options={options}>
                  <native_1.NavigationMetaContext.Provider value={meta}>
                    {render()}
                  </native_1.NavigationMetaContext.Provider>
                </ScreenWithHeader>
              </elements_1.Lazy>
            </react_native_screens_1.Tabs.Screen>);
        })}
      </react_native_screens_1.Tabs.Host>
    </elements_1.SafeAreaProviderCompat>);
}
function ScreenWithHeader({ isFocused, route, navigation, options, children, }) {
    const { headerTransparent, header: renderCustomHeader, headerShown = renderCustomHeader != null, } = options;
    const hasNativeHeader = headerShown && renderCustomHeader == null;
    const [wasNativeHeaderShown] = React.useState(hasNativeHeader);
    React.useEffect(() => {
        if (wasNativeHeaderShown !== hasNativeHeader) {
            throw new Error(`Changing 'headerShown' or 'header' options dynamically is not supported when using native header.`);
        }
    }, [wasNativeHeaderShown, hasNativeHeader]);
    if (hasNativeHeader) {
        return (<NativeScreen_1.NativeScreen route={route} navigation={navigation} options={options}>
        {children}
      </NativeScreen_1.NativeScreen>);
    }
    return (<elements_1.Screen focused={isFocused} route={route} navigation={navigation} headerShown={headerShown} headerTransparent={headerTransparent} header={renderCustomHeader?.({
            route,
            navigation,
            options,
        })}>
      {children}
    </elements_1.Screen>);
}
function getPlatformIcon(icon) {
    switch (icon.type) {
        case 'sfSymbol':
            return {
                ios: icon,
                android: undefined,
                shared: undefined,
            };
        case 'image':
            return {
                ios: icon.tinted === false
                    ? {
                        type: 'imageSource',
                        imageSource: icon.source,
                    }
                    : {
                        type: 'templateSource',
                        templateSource: icon.source,
                    },
                android: undefined,
                shared: {
                    type: 'imageSource',
                    imageSource: icon.source,
                },
            };
        default: {
            const _exhaustiveCheck = icon;
            return _exhaustiveCheck;
        }
    }
}
//# sourceMappingURL=NativeBottomTabView.native.js.map