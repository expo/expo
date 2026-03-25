import React, { ComponentProps } from 'react';
import { ParamListBase, StackNavigationState } from '../react-navigation/native';
import { StackNavigationEventMap, StackNavigationOptions } from '../react-navigation/stack';
import { Protected } from '../views/Protected';
import { Screen } from '../views/Screen';
declare const JSStack: React.ForwardRefExoticComponent<Omit<Omit<import("../react-navigation/stack").StackNavigatorProps, "children" | "layout" | "initialRouteName" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/native").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("../react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation/native").Descriptor<StackNavigationOptions, import("../react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, StackNavigationOptions, StackNavigationEventMap>, import("../react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        transitionStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: StackNavigationOptions | ((props: {
        route: import("../react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => StackNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation/native").ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions, import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/native").Router<StackNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/native").Router<StackNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children"> & Partial<Pick<Omit<import("../react-navigation/stack").StackNavigatorProps, "children" | "layout" | "initialRouteName" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/native").DefaultRouterOptions<string> & ({
    children: React.ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("../react-navigation/native").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("../react-navigation/native").Descriptor<StackNavigationOptions, import("../react-navigation/native").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, StackNavigationOptions, StackNavigationEventMap>, import("../react-navigation/native").RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: import("../react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
    }) => Partial<{
        transitionStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureStart: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureStart", unknown>;
        gestureEnd: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureEnd", unknown>;
        gestureCancel: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        focus: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("../react-navigation/native").EventListenerCallback<StackNavigationEventMap & import("../react-navigation/native").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: StackNavigationOptions | ((props: {
        route: import("../react-navigation/native").RouteProp<ParamListBase, string>;
        navigation: import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>;
        theme: ReactNavigation.Theme;
    }) => StackNavigationOptions) | undefined;
    screenLayout?: ((props: import("../react-navigation/native").ScreenLayoutArgs<ParamListBase, string, StackNavigationOptions, import("../react-navigation/stack").StackNavigationProp<ParamListBase, string, string | undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/native").Router<StackNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/native").Router<StackNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & ({
    id?: undefined;
} | {
    id: string;
})), "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<StackNavigationOptions, StackNavigationState<ParamListBase>, StackNavigationEventMap>) => null;
    Protected: typeof Protected;
};
/**
 * Renders a JavaScript-based stack navigator.
 *
 * Unlike the default `Stack` which uses native navigation primitives,
 * this stack is fully implemented in JavaScript using animated transitions.
 *
 * @hideType
 */
declare const Stack: ((props: ComponentProps<typeof JSStack>) => React.JSX.Element) & {
    Screen: typeof Screen;
    Protected: React.FunctionComponent<import("../views/Protected").ProtectedProps>;
};
export { Stack };
export default Stack;
//# sourceMappingURL=JSStack.d.ts.map