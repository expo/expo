import { BottomTabNavigationEventMap } from '@react-navigation/bottom-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import React from 'react';
import { Href } from '../types';
export declare const Tabs: React.ForwardRefExoticComponent<Omit<import("../types").PickPartial<any, "children">, "ref"> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<import("@react-navigation/elements").HeaderOptions & {
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
        tabBarStyle?: false | "" | import("react-native").RegisteredStyle<import("react-native").ViewStyle> | import("react-native").Animated.Value | import("react-native").Animated.AnimatedInterpolation<string | number> | import("react-native").Animated.WithAnimatedObject<import("react-native").ViewStyle> | import("react-native").Animated.WithAnimatedArray<import("react-native").ViewStyle | import("react-native").Falsy | import("react-native").RegisteredStyle<import("react-native").ViewStyle> | import("react-native").RecursiveArray<import("react-native").ViewStyle | import("react-native").Falsy | import("react-native").RegisteredStyle<import("react-native").ViewStyle>> | readonly (import("react-native").ViewStyle | import("react-native").Falsy | import("react-native").RegisteredStyle<import("react-native").ViewStyle>)[]> | null | undefined;
        tabBarBackground?: (() => React.ReactNode) | undefined;
        lazy?: boolean | undefined;
        header?: ((props: import("@react-navigation/bottom-tabs").BottomTabHeaderProps) => React.ReactNode) | undefined;
        headerShown?: boolean | undefined;
        unmountOnBlur?: boolean | undefined;
        freezeOnBlur?: boolean | undefined;
    } & {
        href?: Href | null | undefined;
    }, TabNavigationState<ParamListBase>, BottomTabNavigationEventMap>) => null;
};
export default Tabs;
//# sourceMappingURL=Tabs.d.ts.map