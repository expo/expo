import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import React from "react";
import { Href } from "../link/href";
export declare const Tabs: React.ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: React.ReactNode;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => BottomTabNavigationOptions) | undefined;
} & import("@react-navigation/routers").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/src/TabRouter").BackBehavior | undefined;
} & import("@react-navigation/bottom-tabs/lib/typescript/src/types").BottomTabNavigationConfig, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: React.ReactNode;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => BottomTabNavigationOptions) | undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: React.ReactNode;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => BottomTabNavigationOptions) | undefined;
} & import("@react-navigation/routers").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/src/TabRouter").BackBehavior | undefined;
} & import("@react-navigation/bottom-tabs/lib/typescript/src/types").BottomTabNavigationConfig, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: React.ReactNode;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        tabPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabPress">;
        tabLongPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "tabLongPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/bottom-tabs").BottomTabNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => BottomTabNavigationOptions) | undefined;
}, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("../useScreens").ScreenProps<import("@react-navigation/elements").HeaderOptions & {
        title?: string | undefined;
        tabBarLabel?: string | ((props: {
            focused: boolean;
            color: string;
            position: import("@react-navigation/bottom-tabs/lib/typescript/src/types").LabelPosition;
            children: string;
        }) => React.ReactNode) | undefined;
        tabBarShowLabel?: boolean | undefined;
        tabBarLabelPosition?: import("@react-navigation/bottom-tabs/lib/typescript/src/types").LabelPosition | undefined;
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
        tabBarTestID?: string | undefined;
        tabBarButton?: ((props: import("@react-navigation/bottom-tabs").BottomTabBarButtonProps) => React.ReactNode) | undefined;
        tabBarActiveTintColor?: string | undefined;
        tabBarInactiveTintColor?: string | undefined;
        tabBarActiveBackgroundColor?: string | undefined;
        tabBarInactiveBackgroundColor?: string | undefined;
        tabBarItemStyle?: import("react-native").StyleProp<import("react-native").ViewStyle>;
        tabBarHideOnKeyboard?: boolean | undefined;
        tabBarVisibilityAnimationConfig?: {
            show?: import("@react-navigation/bottom-tabs/lib/typescript/src/types").TabBarVisibilityAnimationConfig | undefined;
            hide?: import("@react-navigation/bottom-tabs/lib/typescript/src/types").TabBarVisibilityAnimationConfig | undefined;
        } | undefined;
        tabBarStyle?: false | import("react-native").Animated.Value | import("react-native").RegisteredStyle<import("react-native").ViewStyle> | import("react-native").Animated.AnimatedInterpolation<string | number> | import("react-native").Animated.WithAnimatedObject<import("react-native").ViewStyle> | import("react-native").Animated.WithAnimatedArray<import("react-native").Falsy | import("react-native").ViewStyle | import("react-native").RegisteredStyle<import("react-native").ViewStyle> | import("react-native").RecursiveArray<import("react-native").Falsy | import("react-native").ViewStyle | import("react-native").RegisteredStyle<import("react-native").ViewStyle>> | readonly (import("react-native").Falsy | import("react-native").ViewStyle | import("react-native").RegisteredStyle<import("react-native").ViewStyle>)[]> | null | undefined;
        tabBarBackground?: (() => React.ReactNode) | undefined;
        lazy?: boolean | undefined;
        header?: ((props: import("@react-navigation/bottom-tabs").BottomTabHeaderProps) => React.ReactNode) | undefined;
        headerShown?: boolean | undefined;
        unmountOnBlur?: boolean | undefined;
        freezeOnBlur?: boolean | undefined;
    } & {
        href?: Href | null | undefined;
    }>) => null;
};
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map