import type React from 'react';
import type { Animated, PressableAndroidRippleConfig, StyleProp, TextStyle, ViewStyle } from 'react-native';
import type { DefaultNavigatorOptions, Descriptor, NavigationHelpers, NavigationProp, ParamListBase, RouteProp, TabActionHelpers, TabNavigationState, TabRouterOptions, Theme } from '../native';
export type MaterialTopTabNavigationEventMap = {
    /**
     * Event which fires on tapping on the tab in the tab bar.
     */
    tabPress: {
        data: undefined;
        canPreventDefault: true;
    };
    /**
     * Event which fires on long press on the tab in the tab bar.
     */
    tabLongPress: {
        data: undefined;
    };
    /**
     * Event which fires when a swipe gesture starts, i.e. finger touches the screen.
     */
    swipeStart: {
        data: undefined;
    };
    /**
     * Event which fires when a swipe gesture ends, i.e. finger leaves the screen.
     */
    swipeEnd: {
        data: undefined;
    };
};
export type MaterialTopTabNavigationHelpers = NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap> & TabActionHelpers<ParamListBase>;
export type MaterialTopTabNavigationProp<ParamList extends ParamListBase, RouteName extends keyof ParamList = keyof ParamList, NavigatorID extends string | undefined = undefined> = NavigationProp<ParamList, RouteName, NavigatorID, TabNavigationState<ParamList>, MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap> & TabActionHelpers<ParamList>;
export type MaterialTopTabScreenProps<ParamList extends ParamListBase, RouteName extends keyof ParamList = keyof ParamList, NavigatorID extends string | undefined = undefined> = {
    navigation: MaterialTopTabNavigationProp<ParamList, RouteName, NavigatorID>;
    route: RouteProp<ParamList, RouteName>;
};
export type MaterialTopTabOptionsArgs<ParamList extends ParamListBase, RouteName extends keyof ParamList = keyof ParamList, NavigatorID extends string | undefined = undefined> = MaterialTopTabScreenProps<ParamList, RouteName, NavigatorID> & {
    theme: Theme;
};
export type MaterialTopTabNavigationOptions = {
    /**
     * Title text for the screen.
     */
    title?: string;
    /**
     * Title string of a tab displayed in the tab bar
     * or a function that given { focused: boolean, color: string } returns a React.Node, to display in tab bar.
     *
     * When undefined, scene title is used. Use `tabBarShowLabel` to hide the label.
     */
    tabBarLabel?: string | ((props: {
        focused: boolean;
        color: string;
        children: string;
    }) => React.ReactNode);
    /**
     * Accessibility label for the tab button. This is read by the screen reader when the user taps the tab.
     * It's recommended to set this if you don't have a label for the tab.
     */
    tabBarAccessibilityLabel?: string;
    /**
     * Whether label font should scale to respect Text Size accessibility settings.
     */
    tabBarAllowFontScaling?: boolean;
    /**
     * Whether the tab label should be visible. Defaults to `true`.
     */
    tabBarShowLabel?: boolean;
    /**
     * A function that given { focused: boolean, color: string } returns a React.Node to display in the tab bar.
     */
    tabBarIcon?: (props: {
        focused: boolean;
        color: string;
    }) => React.ReactElement;
    /**
     * Whether the tab icon should be visible. Defaults to `false`.
     */
    tabBarShowIcon?: boolean;
    /**
     * Function that returns a React element to use as a badge for the tab.
     */
    tabBarBadge?: () => React.ReactElement;
    /**
     * Function that returns a React element as the tab bar indicator.
     */
    tabBarIndicator?: (props: Omit<Parameters<NonNullable<React.ComponentProps<any>['renderIndicator']>>[0], 'navigationState'> & {
        state: TabNavigationState<ParamListBase>;
    }) => React.ReactNode;
    /**
     * Style object for the tab bar indicator.
     */
    tabBarIndicatorStyle?: StyleProp<ViewStyle>;
    /**
     * Style object for the view containing the tab bar indicator.
     */
    tabBarIndicatorContainerStyle?: StyleProp<ViewStyle>;
    /**
     * ID to locate this tab button in tests.
     */
    tabBarButtonTestID?: string;
    /**
     * Color for the icon and label in the active tab.
     */
    tabBarActiveTintColor?: string;
    /**
     * Color for the icon and label in the inactive tabs.
     */
    tabBarInactiveTintColor?: string;
    /**
     * Color for material ripple (Android >= 5.0 only).
     */
    tabBarPressColor?: string;
    /**
     * Opacity for pressed tab (iOS and Android < 5.0 only).
     */
    tabBarPressOpacity?: number;
    /**
     * Boolean indicating whether the tab bar bounces when overscrolling.
     */
    tabBarBounces?: boolean;
    /**
     * Boolean indicating whether to make the tab bar scrollable.
     *
     * If you set this to `true`, you should also specify a width in `tabBarItemStyle` to improve the performance of initial render.
     */
    tabBarScrollEnabled?: boolean;
    /**
     * Style object for the tab label.
     */
    tabBarLabelStyle?: StyleProp<TextStyle>;
    /**
     * Style object for the individual tab items.
     */
    tabBarItemStyle?: StyleProp<ViewStyle>;
    /**
     * Style object for the view containing the tab items.
     */
    tabBarContentContainerStyle?: StyleProp<ViewStyle>;
    /**
     * Style object for the the tab bar.
     */
    tabBarStyle?: StyleProp<ViewStyle>;
    /**
     * Gap between tabs
     */
    tabBarGap?: number;
    /**
     * Allows to customize the android ripple effect (Android >= 5.0 only).
     *
     * Default: `{ borderless: true }`
     */
    tabBarAndroidRipple?: PressableAndroidRippleConfig;
    /**
     * Whether to enable swipe gestures when this screen is focused.
     * Swipe gestures are enabled by default. Passing `false` will disable swipe gestures,
     * but the user can still switch tabs by pressing the tab bar.
     */
    swipeEnabled?: boolean;
    /**
     * Whether to enable animations when switching between tabs by pressing on the tab bar or programmatically.
     * Switching tab via swipe gesture will still result in an animation.
     */
    animationEnabled?: boolean;
    /**
     * Whether this screen should be lazily rendered. When this is set to `true`,
     * the screen will be rendered as it comes into the viewport.
     * By default all screens are rendered to provide a smoother swipe experience.
     * But you might want to defer the rendering of screens out of the viewport until the user sees them.
     * To enable lazy rendering for this screen, set `lazy` to `true`.
     *
     * When you enable `lazy`, the lazy loaded screens will usually take some time to render
     * when they come into the viewport. You can use the `lazyPlaceholder` prop to customize
     * what the user sees during this short period.
     */
    lazy?: boolean;
    /**
     * When `lazy` is enabled, you can specify how many adjacent screens should be preloaded in advance with this prop.
     * This value defaults to `0` which means lazy pages are loaded as they come into the viewport.
     */
    lazyPreloadDistance?: number;
    /**
     * Function that returns a React element to render if this screen hasn't been rendered yet.
     * The `lazy` option also needs to be enabled for this to work.
     *
     * This view is usually only shown for a split second. Keep it lightweight.
     *
     * By default, this renders `null`.
     */
    lazyPlaceholder?: () => React.ReactNode;
    /**
     * Style object for the component wrapping the screen content.
     */
    sceneStyle?: StyleProp<ViewStyle>;
};
export type MaterialTopTabDescriptor = Descriptor<MaterialTopTabNavigationOptions, MaterialTopTabNavigationProp<ParamListBase>, RouteProp<ParamListBase>>;
export type MaterialTopTabDescriptorMap = Record<string, MaterialTopTabDescriptor>;
export type MaterialTopTabNavigationConfig = Omit<any, 'navigationState' | 'onIndexChange' | 'onSwipeStart' | 'onSwipeEnd' | 'renderScene' | 'renderTabBar' | 'renderLazyPlaceholder' | 'swipeEnabled' | 'animationEnabled' | 'lazy' | 'lazyPreloadDistance' | 'lazyPlaceholder'> & {
    /**
     * Function that returns a React element to display as the tab bar.
     */
    tabBar?: (props: MaterialTopTabBarProps) => React.ReactNode;
};
export type MaterialTopTabBarProps = any & {
    state: TabNavigationState<ParamListBase>;
    navigation: NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap>;
    descriptors: MaterialTopTabDescriptorMap;
};
export type MaterialTopTabAnimationContext = {
    position: Animated.AnimatedInterpolation<number>;
};
export type MaterialTopTabNavigatorProps = DefaultNavigatorOptions<ParamListBase, string | undefined, TabNavigationState<ParamListBase>, MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap, MaterialTopTabNavigationProp<ParamListBase>> & TabRouterOptions & MaterialTopTabNavigationConfig;
//# sourceMappingURL=types.d.ts.map