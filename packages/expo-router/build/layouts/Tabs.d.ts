import { BottomTabNavigationEventMap, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import React from 'react';
import { Href } from '../types';
export declare const Tabs: React.ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/native").DefaultNavigatorOptions<ParamListBase, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap, import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase>> & import("@react-navigation/native").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/commonjs/src/TabRouter").BackBehavior | undefined;
} & import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").BottomTabNavigationConfig, "initialRouteName" | "children" | "id" | "screenOptions" | "layout" | "screenListeners" | "screenLayout" | "UNSTABLE_getStateForRouteNamesChange"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<BottomTabNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) | undefined;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        tabPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
        children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    }) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) | undefined;
    UNSTABLE_getStateForRouteNamesChange?: ((state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>) => import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>> | undefined) | undefined;
} & {
    id?: undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/native").DefaultNavigatorOptions<ParamListBase, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap, import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase>> & import("@react-navigation/native").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/commonjs/src/TabRouter").BackBehavior | undefined;
} & import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").BottomTabNavigationConfig, "initialRouteName" | "children" | "id" | "screenOptions" | "layout" | "screenListeners" | "screenLayout" | "UNSTABLE_getStateForRouteNamesChange"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<BottomTabNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) | undefined;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        tabPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
        children: React.ReactElement<any, string | React.JSXElementConstructor<any>>;
    }) => React.ReactElement<any, string | React.JSXElementConstructor<any>>) | undefined;
    UNSTABLE_getStateForRouteNamesChange?: ((state: Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>) => import("@react-navigation/native").PartialState<Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[] | undefined;
        routes: import("@react-navigation/native").NavigationRoute<ParamListBase, string>[];
        type: string;
        stale: false;
    }>> | undefined) | undefined;
} & {
    id?: undefined;
}, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<import("@react-navigation/elements").HeaderOptions & {
        title?: string | undefined;
        tabBarLabel?: string | ((props: {
            focused: boolean;
            color: string;
            position: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").LabelPosition;
            children: string;
        }) => React.ReactNode) | undefined;
        tabBarShowLabel?: boolean | undefined;
        tabBarLabelPosition?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").LabelPosition | undefined;
        tabBarLabelStyle?: import("react-native").StyleProp<import("react-native").TextStyle>;
        tabBarAllowFontScaling?: boolean | undefined;
        tabBarIcon?: ((props: {
            focused: boolean;
            color: string;
            size: number;
        }) => React.ReactNode) | undefined;
        tabBarIconStyle?: import("react-native").StyleProp<import("react-native").TextStyle>;
        tabBarBadge?: string | number | undefined;
        tabBarBadgeStyle?: import("react-native").StyleProp<import("react-native").TextStyle>;
        tabBarAccessibilityLabel?: string | undefined;
        tabBarButtonTestID?: string | undefined;
        tabBarButton?: ((props: import("@react-navigation/bottom-tabs").BottomTabBarButtonProps) => React.ReactNode) | undefined;
        tabBarActiveTintColor?: string | undefined;
        tabBarInactiveTintColor?: string | undefined;
        tabBarActiveBackgroundColor?: string | undefined;
        tabBarInactiveBackgroundColor?: string | undefined;
        tabBarItemStyle?: import("react-native").StyleProp<import("react-native").ViewStyle>;
        tabBarHideOnKeyboard?: boolean | undefined;
        tabBarVisibilityAnimationConfig?: {
            show?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").TabBarVisibilityAnimationConfig | undefined;
            hide?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").TabBarVisibilityAnimationConfig | undefined;
        } | undefined;
        tabBarVariant?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").Variant | undefined;
        tabBarStyle?: false | "" | import("react-native").Animated.Value | import("react-native").RegisteredStyle<import("react-native").ViewStyle> | import("react-native").Animated.WithAnimatedObject<import("react-native").ViewStyle> | import("react-native").Animated.AnimatedInterpolation<string | number> | import("react-native").Animated.WithAnimatedArray<import("react-native").ViewStyle | import("react-native").Falsy | import("react-native").RegisteredStyle<import("react-native").ViewStyle> | import("react-native").RecursiveArray<import("react-native").ViewStyle | import("react-native").Falsy | import("react-native").RegisteredStyle<import("react-native").ViewStyle>> | readonly (import("react-native").ViewStyle | import("react-native").Falsy | import("react-native").RegisteredStyle<import("react-native").ViewStyle>)[]> | null | undefined;
        tabBarBackground?: (() => React.ReactNode) | undefined;
        tabBarPosition?: "bottom" | "left" | "right" | "top" | undefined;
        lazy?: boolean | undefined;
        header?: ((props: import("@react-navigation/bottom-tabs").BottomTabHeaderProps) => React.ReactNode) | undefined;
        headerShown?: boolean | undefined;
        popToTopOnBlur?: boolean | undefined;
        freezeOnBlur?: boolean | undefined;
        animation?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").TabAnimationName | undefined;
        sceneStyleInterpolator?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").BottomTabSceneStyleInterpolator | undefined;
        transitionSpec?: import("@react-navigation/bottom-tabs/lib/typescript/commonjs/src/types").TransitionSpec | undefined;
    } & {
        href?: Href | null | undefined;
    }, TabNavigationState<ParamListBase>, BottomTabNavigationEventMap>) => null;
};
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map