import type { ComponentProps } from 'react';
import type { BottomTabNavigationEventMap, BottomTabNavigationOptions } from '../react-navigation/bottom-tabs';
import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import type { Href } from '../types';
import { Protected } from '../views/Protected';
declare const BottomTabNavigator: import("react").ComponentType<Omit<import("../react-navigation/bottom-tabs").BottomTabNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("../react-navigation").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation").Descriptor<BottomTabNavigationOptions, import("../react-navigation").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("../react-navigation").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation").ScreenLayoutArgs<ParamListBase, string, BottomTabNavigationOptions, import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
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
        navigation: import("../react-navigation").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation").Descriptor<BottomTabNavigationOptions, import("../react-navigation").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("../react-navigation").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation").ScreenLayoutArgs<ParamListBase, string, BottomTabNavigationOptions, import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
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
        navigation: import("../react-navigation").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation").Descriptor<BottomTabNavigationOptions, import("../react-navigation").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, BottomTabNavigationOptions, BottomTabNavigationEventMap>, import("../react-navigation").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        transitionStart: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<BottomTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: BottomTabNavigationOptions | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => BottomTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation").ScreenLayoutArgs<ParamListBase, string, BottomTabNavigationOptions, import("../react-navigation/bottom-tabs").BottomTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
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