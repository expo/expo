/// <reference types="react" />
import { DrawerNavigationOptions, DrawerNavigationEventMap } from '@react-navigation/drawer';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/native").DefaultNavigatorOptions<ParamListBase, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap, import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase>> & import("@react-navigation/native").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/commonjs/src/TabRouter").BackBehavior | undefined;
} & {
    defaultStatus?: import("@react-navigation/native").DrawerStatus | undefined;
} & import("@react-navigation/drawer/lib/typescript/commonjs/src/types").DrawerNavigationConfig, "children" | "initialRouteName" | "id" | "screenOptions" | "layout" | "screenListeners" | "screenLayout" | "UNSTABLE_getStateForRouteNamesChange"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: import("react").ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<DrawerNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: import("react").ReactNode;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
        children: import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>) | undefined;
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
}, "children"> & Partial<Pick<Omit<import("@react-navigation/native").DefaultNavigatorOptions<ParamListBase, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap, import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase>> & import("@react-navigation/native").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/commonjs/src/TabRouter").BackBehavior | undefined;
} & {
    defaultStatus?: import("@react-navigation/native").DrawerStatus | undefined;
} & import("@react-navigation/drawer/lib/typescript/commonjs/src/types").DrawerNavigationConfig, "children" | "initialRouteName" | "id" | "screenOptions" | "layout" | "screenListeners" | "screenLayout" | "UNSTABLE_getStateForRouteNamesChange"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: import("react").ReactNode;
    layout?: ((props: {
        state: DrawerNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<DrawerNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, DrawerNavigationState<ParamListBase>, DrawerNavigationOptions, DrawerNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: import("react").ReactNode;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>) | undefined;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress", true>;
        transitionStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => DrawerNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/drawer").DrawerNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
        children: import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>) | undefined;
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
}, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<DrawerNavigationOptions, DrawerNavigationState<ParamListBase>, DrawerNavigationEventMap>) => null;
};
export default Drawer;
//# sourceMappingURL=DrawerClient.d.ts.map