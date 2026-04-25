import type { ComponentProps } from 'react';
import { type StackScreenProps, StackSearchBar } from './stack-utils';
import { type ParamListBase, type StackNavigationState, StackRouter as RNStackRouter, type RouteProp } from '../react-navigation/native';
import type { NativeStackNavigationEventMap, NativeStackNavigationOptions } from '../react-navigation/native-stack';
import { Protected } from '../views/Protected';
/**
 * We extend NativeStackNavigationOptions with our custom props
 * to allow for several extra props to be used on web, like modalWidth
 */
export type ExtendedStackNavigationOptions = NativeStackNavigationOptions & {
    webModalStyle?: {
        /**
         * Override the width of the modal (px or percentage). Only applies on web platform.
         * @platform web
         */
        width?: number | string;
        /**
         * Override the height of the modal (px or percentage). Applies on web desktop.
         * @platform web
         */
        height?: number | string;
        /**
         * Minimum height of the desktop modal (px or percentage). Overrides the default 640px clamp.
         * @platform web
         */
        minHeight?: number | string;
        /**
         * Minimum width of the desktop modal (px or percentage). Overrides the default 580px.
         * @platform web
         */
        minWidth?: number | string;
        /**
         * Override the border of the desktop modal (any valid CSS border value, e.g. '1px solid #ccc' or 'none').
         * @platform web
         */
        border?: string;
        /**
         * Override the overlay background color (any valid CSS color or rgba/hsla value).
         * @platform web
         */
        overlayBackground?: string;
        /**
         * Override the modal shadow filter (any valid CSS filter value, e.g. 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' or 'none').
         * @platform web
         */
        shadow?: string;
    };
};
declare const RNStack: import("react").ForwardRefExoticComponent<Omit<Omit<import("..").NativeStackNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<NativeStackNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, NativeStackNavigationOptions, NativeStackNavigationEventMap>, RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: RouteProp<ParamListBase, string>;
        navigation: import("..").NativeStackNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        transitionStart: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: RouteProp<ParamListBase, string>;
        navigation: import("..").NativeStackNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => NativeStackNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, NativeStackNavigationOptions, import("..").NativeStackNavigationProp<ParamListBase, string, undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & {
    id?: undefined;
}, "children"> & Partial<Pick<Omit<import("..").NativeStackNavigatorProps, "children" | "initialRouteName" | "layout" | "screenListeners" | "screenOptions" | "screenLayout" | "UNSTABLE_router" | "UNSTABLE_routeNamesChangeBehavior" | "id"> & import("../react-navigation/core").DefaultRouterOptions<string> & {
    children: React.ReactNode;
    layout?: ((props: {
        state: StackNavigationState<ParamListBase>;
        navigation: import("..").NavigationHelpers<ParamListBase, {}>;
        descriptors: Record<string, import("..").Descriptor<NativeStackNavigationOptions, import("..").NavigationProp<ParamListBase, string, string | undefined, StackNavigationState<ParamListBase>, NativeStackNavigationOptions, NativeStackNavigationEventMap>, RouteProp<ParamListBase, string>>>;
        children: React.ReactNode;
    }) => React.ReactElement) | undefined;
    screenListeners?: Partial<{
        transitionStart: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }> | ((props: {
        route: RouteProp<ParamListBase, string>;
        navigation: import("..").NativeStackNavigationProp<ParamListBase, string, undefined>;
    }) => Partial<{
        transitionStart: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionStart", unknown>;
        transitionEnd: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "transitionEnd", unknown>;
        gestureCancel: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "gestureCancel", unknown>;
        sheetDetentChange: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "sheetDetentChange", unknown>;
        focus: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "focus", unknown>;
        blur: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "blur", unknown>;
        state: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "state", unknown>;
        beforeRemove: import("..").EventListenerCallback<NativeStackNavigationEventMap & import("..").EventMapCore<StackNavigationState<ParamListBase>>, "beforeRemove", true>;
    }>) | undefined;
    screenOptions?: NativeStackNavigationOptions | ((props: {
        route: RouteProp<ParamListBase, string>;
        navigation: import("..").NativeStackNavigationProp<ParamListBase, string, undefined>;
        theme: ReactNavigation.Theme;
    }) => NativeStackNavigationOptions) | undefined;
    screenLayout?: ((props: import("..").ScreenLayoutArgs<ParamListBase, string, NativeStackNavigationOptions, import("..").NativeStackNavigationProp<ParamListBase, string, undefined>>) => React.ReactElement) | undefined;
    UNSTABLE_router?: (<Action extends Readonly<{
        type: string;
        payload?: object;
        source?: string;
        target?: string;
    }>>(original: import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>) => Partial<import("../react-navigation/core").Router<StackNavigationState<ParamListBase>, Action>>) | undefined;
    UNSTABLE_routeNamesChangeBehavior?: "firstMatch" | "lastUnhandled";
} & {
    id?: undefined;
}, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<ExtendedStackNavigationOptions, StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>) => null;
    Protected: typeof Protected;
};
/**
 * React Navigation matches a screen by its name or a 'getID' function that uniquely identifies a screen.
 * When a screen has been uniquely identified, the Stack can only have one instance of that screen.
 *
 * Expo Router allows for a screen to be matched by name and path params, a 'getID' function or a singular id.
 *
 * Instead of reimplementing the entire StackRouter, we can override the getStateForAction method to handle the singular screen logic.
 *
 */
export declare const stackRouterOverride: NonNullable<ComponentProps<typeof RNStack>['UNSTABLE_router']>;
/**
 * Renders a native stack navigator.
 *
 * @hideType
 */
declare const Stack: ((props: ComponentProps<typeof RNStack>) => import("react/jsx-runtime").JSX.Element) & {
    Screen: (({ children, options, ...rest }: StackScreenProps) => import("react/jsx-runtime").JSX.Element) & {
        Title: typeof import("./stack-utils").StackScreenTitle;
        BackButton: typeof import("./stack-utils").StackScreenBackButton;
    };
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
    Header: typeof import("./stack-utils/StackHeaderComponent").StackHeaderComponent;
    SearchBar: typeof StackSearchBar;
    Toolbar: {
        (props: import("./stack-utils").StackToolbarProps): import("react/jsx-runtime").JSX.Element;
        Button: import("react").FC<import("./stack-utils").StackToolbarButtonProps>;
        Menu: import("react").FC<import("./stack-utils").StackToolbarMenuProps>;
        MenuAction: import("react").FC<import("./stack-utils").StackToolbarMenuActionProps>;
        SearchBarSlot: import("react").FC<import("./stack-utils").StackToolbarSearchBarSlotProps>;
        Spacer: import("react").FC<import("./stack-utils").StackToolbarSpacerProps>;
        View: import("react").FC<import("./stack-utils").StackToolbarViewProps>;
        Label: import("react").FC<import("./stack-utils").StackToolbarLabelProps>;
        Icon: import("react").FC<import("./stack-utils").StackToolbarIconProps>;
        Badge: import("react").FC<import("./stack-utils").StackToolbarBadgeProps>;
    };
};
export default Stack;
export declare const StackRouter: typeof RNStackRouter;
//# sourceMappingURL=StackClient.d.ts.map