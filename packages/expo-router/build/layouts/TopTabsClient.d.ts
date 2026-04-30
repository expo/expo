import type { ComponentProps } from 'react';
import type { MaterialTopTabNavigationEventMap, MaterialTopTabNavigationOptions } from '../react-navigation/material-top-tabs';
import type { ParamListBase, TabNavigationState } from '../react-navigation/native';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
declare const MaterialTopTabs: import("react").ForwardRefExoticComponent<Omit<import("..").PickPartial<Omit<import("../react-navigation/material-top-tabs").MaterialTopTabNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: TabNavigationState<ParamListBase>;
        navigation: import("../react-navigation").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation").Descriptor<MaterialTopTabNavigationOptions, import("../react-navigation").NavigationProp<ParamListBase, string, string | undefined, TabNavigationState<ParamListBase>, MaterialTopTabNavigationOptions, MaterialTopTabNavigationEventMap>, import("../react-navigation").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        swipeStart: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "swipeStart", unknown>;
        swipeEnd: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "swipeEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/material-top-tabs").MaterialTopTabNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        tabPress: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabPress", true>;
        tabLongPress: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "tabLongPress", unknown>;
        swipeStart: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "swipeStart", unknown>;
        swipeEnd: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "swipeEnd", unknown>;
        focus: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation").EventListenerCallback<MaterialTopTabNavigationEventMap & import("../react-navigation").EventMapCore<TabNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: MaterialTopTabNavigationOptions | ((props: {
        route: import("../react-navigation").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/material-top-tabs").MaterialTopTabNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => MaterialTopTabNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation").ScreenLayoutArgs<ParamListBase, string, MaterialTopTabNavigationOptions, import("../react-navigation/material-top-tabs").MaterialTopTabNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<TabNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children">, "ref"> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<MaterialTopTabNavigationOptions, TabNavigationState<ParamListBase>, MaterialTopTabNavigationEventMap>) => null;
    Protected: typeof Protected;
};
/**
 * Renders a material top tab navigator.
 *
 * @hideType
 */
declare const TopTabs: ((props: ComponentProps<typeof MaterialTopTabs>) => import("react/jsx-runtime").JSX.Element) & {
    Screen: typeof Screen;
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
};
export { TopTabs };
export default TopTabs;
//# sourceMappingURL=TopTabsClient.d.ts.map