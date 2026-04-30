import type { DrawerNavigationOptions, DrawerNavigationEventMap } from '../react-navigation/drawer';
import type { DrawerNavigationState, ParamListBase } from '../react-navigation/native';
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<Omit<import("../react-navigation/drawer").DrawerNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("../react-navigation").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation").Descriptor<DrawerNavigationOptions, import("../react-navigation").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("../react-navigation").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        drawerItemPress: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation").ScreenLayoutArgs<ParamListBase, string, DrawerNavigationOptions, import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
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
        navigation: import("../react-navigation").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation").Descriptor<DrawerNavigationOptions, import("../react-navigation").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("../react-navigation").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        drawerItemPress: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<DrawerNavigationEventMap & import("../react-navigation").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation").ScreenLayoutArgs<ParamListBase, string, DrawerNavigationOptions, import("../react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
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