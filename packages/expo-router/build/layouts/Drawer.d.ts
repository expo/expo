/// <reference types="react" />
import { DrawerNavigationOptions } from "@react-navigation/drawer";
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
} & import("@react-navigation/routers").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/src/TabRouter").BackBehavior | undefined;
} & {
    defaultStatus?: import("@react-navigation/routers").DrawerStatus | undefined;
} & import("@react-navigation/drawer/lib/typescript/src/types").DrawerNavigationConfig, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
} & import("@react-navigation/routers").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/src/TabRouter").BackBehavior | undefined;
} & {
    defaultStatus?: import("@react-navigation/routers").DrawerStatus | undefined;
} & import("@react-navigation/drawer/lib/typescript/src/types").DrawerNavigationConfig, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/routers").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "drawerItemPress">;
        focus: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "focus">;
        blur: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "blur">;
        state: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "state">;
        beforeRemove: import("@react-navigation/core").EventListenerCallback<import("@react-navigation/drawer").DrawerNavigationEventMap, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/core").RouteProp<import("@react-navigation/routers").ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
}, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("../useScreens").ScreenProps<DrawerNavigationOptions>) => null;
};
export default Drawer;
//# sourceMappingURL=Drawer.d.ts.map