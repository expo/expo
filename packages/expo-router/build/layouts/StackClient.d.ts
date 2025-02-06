/// <reference types="react" />
import { ParamListBase, StackNavigationState } from '@react-navigation/native';
import { NativeStackNavigationEventMap, NativeStackNavigationOptions } from '@react-navigation/native-stack';
export declare const Stack: import("react").ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/native-stack").NativeStackNavigatorProps, "initialRouteName" | "children" | "layout" | "id" | "screenOptions" | "screenListeners" | "screenLayout" | "UNSTABLE_getStateForRouteNamesChange"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: import("react").ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<NativeStackNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, NativeStackNavigationOptions, NativeStackNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: import("react").ReactNode;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        transitionStart: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => NativeStackNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<ParamListBase, string, undefined>;
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
}, "children"> & Partial<Pick<Omit<import("@react-navigation/native-stack").NativeStackNavigatorProps, "initialRouteName" | "children" | "layout" | "id" | "screenOptions" | "screenListeners" | "screenLayout" | "UNSTABLE_getStateForRouteNamesChange"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    children: import("react").ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("@react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/native").Descriptor<NativeStackNavigationOptions, import("@react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, NativeStackNavigationOptions, NativeStackNavigationEventMap>, import("@react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: import("react").ReactNode;
    }) => import("react").ReactElement<any, string | import("react").JSXElementConstructor<any>>) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        transitionStart: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<NativeStackNavigationEventMap & import("@react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => NativeStackNavigationOptions) | undefined;
    screenLayout?: ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<ParamListBase, string, undefined>;
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
    Screen: (props: import("..").ScreenProps<NativeStackNavigationOptions, StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>) => null;
};
export default Stack;
//# sourceMappingURL=StackClient.d.ts.map