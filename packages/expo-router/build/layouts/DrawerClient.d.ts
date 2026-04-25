import type { DrawerNavigationOptions, DrawerNavigationEventMap } from '../react-navigation/drawer';
import type { DrawerNavigationState, ParamListBase } from '../react-navigation/native';
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<Omit<import("../react-navigation/drawer").DrawerNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<DrawerNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        drawerItemPress: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, DrawerNavigationOptions, import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<DrawerNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<DrawerNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children"> & Partial<Pick<Omit<import("../react-navigation/drawer").DrawerNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<DrawerNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        drawerItemPress: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<DrawerNavigationEventMap & import("..").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, DrawerNavigationOptions, import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<DrawerNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<DrawerNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<DrawerNavigationOptions, DrawerNavigationState<ParamListBase>, DrawerNavigationEventMap>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
export default Drawer;
//# sourceMappingURL=DrawerClient.d.ts.map