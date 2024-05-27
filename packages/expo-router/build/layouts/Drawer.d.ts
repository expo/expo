/// <reference types="react" />
import { DrawerNavigationOptions, DrawerNavigationEventMap } from '@react-navigation/drawer';
import { DrawerNavigationState, ParamListBase } from '@react-navigation/native';
export declare const Drawer: import("react").ForwardRefExoticComponent<Omit<Omit<import("@react-navigation/native").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
} & import("@react-navigation/native").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/src/TabRouter").BackBehavior | undefined;
} & {
    defaultStatus?: import("@react-navigation/native").DrawerStatus | undefined;
} & import("@react-navigation/drawer/lib/typescript/src/types").DrawerNavigationConfig, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
}, "children"> & Partial<Pick<Omit<import("@react-navigation/native").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
} & import("@react-navigation/native").DefaultRouterOptions & {
    backBehavior?: import("@react-navigation/routers/lib/typescript/src/TabRouter").BackBehavior | undefined;
} & {
    defaultStatus?: import("@react-navigation/native").DrawerStatus | undefined;
} & import("@react-navigation/drawer/lib/typescript/src/types").DrawerNavigationConfig, "initialRouteName" | "children" | "id" | "screenListeners" | "screenOptions"> & import("@react-navigation/native").DefaultRouterOptions<string> & {
    id?: string | undefined;
    children: import("react").ReactNode;
    screenListeners?: Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }> | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => Partial<{
        drawerItemPress: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "drawerItemPress">;
        focus: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "focus">;
        blur: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "blur">;
        state: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "state">;
        beforeRemove: import("@react-navigation/native").EventListenerCallback<DrawerNavigationEventMap & import("@react-navigation/native").EventMapCore<DrawerNavigationState<ParamListBase>>, "beforeRemove">;
    }>) | undefined;
    screenOptions?: DrawerNavigationOptions | ((props: {
        route: import("@react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: any;
    }) => DrawerNavigationOptions) | undefined;
}, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("../useScreens").ScreenProps<DrawerNavigationOptions, DrawerNavigationState<ParamListBase>, DrawerNavigationEventMap>) => null;
};
export default Drawer;
//# sourceMappingURL=Drawer.d.ts.map