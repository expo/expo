import React, { ComponentProps } from 'react';
import { MaterialTopTabNavigationEventMap, MaterialTopTabNavigationOptions } from '../react-navigation/material-top-tabs';
import { ParamListBase, TabNavigationState } from '../react-navigation/native';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
declare const MaterialTopTabs: React.ForwardRefExoticComponent<Omit<import("..").PickPartial<Omit<import("../react-navigation/material-top-tabs").MaterialTopTabNavigatorProps, "children" | "layout" | "initialRouteName" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/native").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("../react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation/native").Descriptor<MaterialTopTabNavigationOptions, import("../react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap>, import("../react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        swipeStart: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "swipeStart", unknown>;
        swipeEnd: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "swipeEnd", unknown>;
        focus: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/material-top-tabs").MaterialTopTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        swipeStart: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "swipeStart", unknown>;
        swipeEnd: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "swipeEnd", unknown>;
        focus: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation/native").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation/native").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: MaterialTopTabNavigationOptions | ((props: {
        route: import("../react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/material-top-tabs").MaterialTopTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => MaterialTopTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation/native").ScreenLayoutArgs<ParamListBase, string, MaterialTopTabNavigationOptions, import("../react-navigation/material-top-tabs").MaterialTopTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/native").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/native").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children">, "ref"> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<MaterialTopTabNavigationOptions, TabNavigationState<ParamListBase>, MaterialTopTabNavigationEventMap>) => null;
    Protected: typeof Protected;
};
/**
 * Renders a material top tab navigator.
 *
 * @hideType
 */
declare const TopTabs: ((props: ComponentProps<typeof MaterialTopTabs>) => React.JSX.Element) & {
    Screen: typeof Screen;
    Protected: React.FunctionComponent<import("../views/Protected").ProtectedProps>;
};
export { TopTabs };
export default TopTabs;
//# sourceMappingURL=TopTabsClient.d.ts.map