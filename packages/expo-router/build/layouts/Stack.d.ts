/// <reference types="react" />
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';
export declare const Stack: import("react").ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => NativeStackNavigationOptions) | undefined;
} & import("@react-navigation/routers").StackRouterOptions, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => NativeStackNavigationOptions) | undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => NativeStackNavigationOptions) | undefined;
} & import("@react-navigation/routers").StackRouterOptions, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        transitionStart: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionStart">;
        transitionEnd: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "transitionEnd">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/native-stack").NativeStackNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => NativeStackNavigationOptions) | undefined;
}, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("../useScreens").ScreenProps<NativeStackNavigationOptions>) => null;
};
export default Stack;
//# sourceMappingURL=Stack.d.ts.map