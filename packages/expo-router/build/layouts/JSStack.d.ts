import type { ComponentProps } from 'react';
import type { ParamListBase, StackNavigationState } from '../react-navigation/native';
import type { StackNavigationEventMap, StackNavigationOptions } from '../react-navigation/stack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
declare const JSStack: import("react").ForwardRefExoticComponent<Omit<Omit<import("../react-navigation/stack").StackNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<StackNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, StackNavigationOptions, StackNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        transitionStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: StackNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => StackNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions, import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children"> & Partial<Pick<Omit<import("../react-navigation/stack").StackNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<StackNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, StackNavigationOptions, StackNavigationEventMap>, import("..").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        transitionStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<StackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: StackNavigationOptions | ((props: {
        route: import("..").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => StackNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions, import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<StackNavigationOptions, StackNavigationState<ParamListBase>, StackNavigationEventMap>) => null;
    Protected: typeof Protected;
};
/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
declare const Stack: ((props: ComponentProps<typeof JSStack>) => import("react/jsx-runtime").JSX.Element) & {
    Screen: typeof Screen;
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
};
export { Stack };
export default Stack;
//# sourceMappingURL=JSStack.d.ts.map