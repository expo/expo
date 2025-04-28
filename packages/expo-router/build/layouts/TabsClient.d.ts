import { BottomTabNavigationEventMap, BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import React from 'react';
import { Href } from '../types';
type TabsProps = BottomTabNavigationOptions & {
    href?: Href | null;
};
export declare const Tabs: React.ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/bottom-tabs").BottomTabNavigatorProps, "children" | "layout" | "initialRouteName" | "id" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<BottomTabNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
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
        transitionStart: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
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
        children: React.ReactElement;
    }) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("@react-navigation/native").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("@react-navigation/native").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
} & {
    id?: undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/bottom-tabs").BottomTabNavigatorProps, "children" | "layout" | "initialRouteName" | "id" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<BottomTabNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
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
        transitionStart: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<BottomTabNavigationEventMap & import("@react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
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
        children: React.ReactElement;
    }) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("@react-navigation/native").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("@react-navigation/native").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
} & {
    id?: undefined;
}, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<TabsProps, TabNavigationState<ParamListBase>, BottomTabNavigationEventMap>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
export default Tabs;
//# sourceMappingURL=TabsClient.d.ts.map