import { DrawerNavigationOptions, DrawerNavigationEventMap } from '@react-navigation/drawer';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/drawer").DrawerNavigatorProps, "initialRouteName" | "children" | "layout" | "id" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("@react-navigation/core").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/core").Descriptor<DrawerNavigationOptions, import("@react-navigation/core").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("@react-navigation/core").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/core").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
        children: React.ReactElement;
    }) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("@react-navigation/routers").Router<DrawerNavigationState<ParamListBase>, Action>) => Partial<import("@react-navigation/routers").Router<DrawerNavigationState<ParamListBase>, Action>>) | undefined;
} & {
    id?: undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/drawer").DrawerNavigatorProps, "initialRouteName" | "children" | "layout" | "id" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("@react-navigation/core").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/core").Descriptor<DrawerNavigationOptions, import("@react-navigation/core").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("@react-navigation/core").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/core").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/core").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
        children: React.ReactElement;
    }) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("@react-navigation/routers").Router<DrawerNavigationState<ParamListBase>, Action>) => Partial<import("@react-navigation/routers").Router<DrawerNavigationState<ParamListBase>, Action>>) | undefined;
} & {
    id?: undefined;
}, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<DrawerNavigationOptions, DrawerNavigationState<ParamListBase>, DrawerNavigationEventMap>) => null;
};
export default Drawer;
//# sourceMappingURL=DrawerClient.d.ts.map