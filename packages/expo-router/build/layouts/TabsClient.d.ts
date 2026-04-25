import type { ComponentProps } from 'react';
import type { BottomTabNavigationEventMap, BottomTabNavigationOptions } from '../react-navigation/bottom-tabs';
import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import type { Href } from '../types';
import { Protected } from '../views/Protected';
declare const BottomTabNavigator: import("react").ComponentType<Omit<import("../react-navigation/bottom-tabs").BottomTabNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<BottomTabNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, BottomTabNavigationOptions, import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
}))>;
export type BottomTabNavigator = typeof BottomTabNavigator;
type TabsProps = BottomTabNavigationOptions & {
    href?: Href | null;
};
declare const ExpoTabs: import("react").ForwardRefExoticComponent<Omit<Omit<import("../react-navigation/bottom-tabs").BottomTabNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<BottomTabNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, BottomTabNavigationOptions, import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children"> & Partial<Pick<Omit<import("../react-navigation/bottom-tabs").BottomTabNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<BottomTabNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<BottomTabNavigationEventMap & import("..").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, BottomTabNavigationOptions, import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<TabsProps, TabNavigationState<ParamListBase>, BottomTabNavigationEventMap>) => null;
    Protected: typeof Protected;
};
/**
 * Renders a tabs navigator.
 *
 * @hideType
 */
declare const Tabs: ((props: ComponentProps<typeof ExpoTabs>) => import("react/jsx-runtime").JSX.Element) & {
    Screen: (props: import("..").ScreenProps<TabsProps, TabNavigationState<ParamListBase>, BottomTabNavigationEventMap>) => null;
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
};
export default Tabs;
//# sourceMappingURL=TabsClient.d.ts.map