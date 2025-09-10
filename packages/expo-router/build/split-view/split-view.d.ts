import React from 'react';
import type { SplitViewContextType, SplitViewProps } from './types';
export declare const SplitView: React.ForwardRefExoticComponent<Omit<import("..").PickPartial<Omit<Omit<import("@react-navigation/native-stack").NativeStackNavigatorProps, "children" | "layout" | "initialRouteName" | "id" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>;
        navigation: import("@react-navigation/core").NavigationHelpers<import("@react-navigation/routers").ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/core").Descriptor<import("@react-navigation/native-stack").NativeStackNavigationOptions, import("@react-navigation/core").NavigationProp<import("@react-navigation/routers").ParamListBase, string, string | undefined, import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>, import("@react-navigation/native-stack").NativeStackNavigationOptions, import("@react-navigation/native-stack").NativeStackNavigationEventMap>, import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<import("@react-navigation/routers").ParamListBase, string, undefined>;
    }) => Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: import("@react-navigation/native-stack").NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<import("@react-navigation/routers").ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => import("@react-navigation/native-stack").NativeStackNavigationOptions) | undefined;
    screenLayout?: ((props: import("@react-navigation/core").ScreenLayoutArgs<import("@react-navigation/routers").ParamListBase, string, import("@react-navigation/native-stack").NativeStackNavigationOptions, import("@react-navigation/native-stack").NativeStackNavigationProp<import("@react-navigation/routers").ParamListBase, string, undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("@react-navigation/routers").Router<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>, Action>) => Partial<import("@react-navigation/routers").Router<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>, Action>>) | undefined;
} & {
    id?: undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/native-stack").NativeStackNavigatorProps, "children" | "layout" | "initialRouteName" | "id" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>;
        navigation: import("@react-navigation/core").NavigationHelpers<import("@react-navigation/routers").ParamListBase, {}>;
        descriptors: Record<string, import("@react-navigation/core").Descriptor<import("@react-navigation/native-stack").NativeStackNavigationOptions, import("@react-navigation/core").NavigationProp<import("@react-navigation/routers").ParamListBase, string, string | undefined, import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>, import("@react-navigation/native-stack").NativeStackNavigationOptions, import("@react-navigation/native-stack").NativeStackNavigationEventMap>, import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<import("@react-navigation/routers").ParamListBase, string, undefined>;
    }) => Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "focus", unknown>;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "blur", unknown>;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "state", unknown>;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap & import("@react-navigation/core").EventMapCore<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: import("@react-navigation/native-stack").NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: import("@react-navigation/native-stack").NativeStackNavigationProp<import("@react-navigation/routers").ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => import("@react-navigation/native-stack").NativeStackNavigationOptions) | undefined;
    screenLayout?: ((props: import("@react-navigation/core").ScreenLayoutArgs<import("@react-navigation/routers").ParamListBase, string, import("@react-navigation/native-stack").NativeStackNavigationOptions, import("@react-navigation/native-stack").NativeStackNavigationProp<import("@react-navigation/routers").ParamListBase, string, undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("@react-navigation/routers").Router<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>, Action>) => Partial<import("@react-navigation/routers").Router<import("@react-navigation/routers").StackNavigationState<import("@react-navigation/routers").ParamListBase>, Action>>) | undefined;
} & {
    id?: undefined;
}, "children">> & React.RefAttributes<unknown> & SplitViewProps, "children">, "ref"> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<object, Readonly<{
        key: string;
        index: number;
        routeNames: string[];
        history?: unknown[];
        routes: import("@react-navigation/routers").NavigationRoute<import("@react-navigation/routers").ParamListBase, string>[];
        type: string;
        stale: false;
    }>, import("@react-navigation/core").EventMapBase>) => null;
    Protected: typeof import("../views/Protected").Protected;
};
export declare const SplitViewContext: React.Context<SplitViewContextType>;
//# sourceMappingURL=split-view.d.ts.map