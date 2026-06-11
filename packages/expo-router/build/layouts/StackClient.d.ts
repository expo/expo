import type { ComponentProps } from 'react';
import { type ExtendedStackNavigationOptions, type NativeStackContentProps } from '../fork/native-stack/createStandardNativeStackNavigator';
import { type StackScreenProps, StackSearchBar, StackTitle } from './stack-utils';
import { type ParamListBase, type StackNavigationState, StackRouter as RNStackRouter, type StackRouterOptions } from '../react-navigation/native';
import type { NativeStackNavigationEventMap } from '../react-navigation/native-stack';
import { Protected } from '../views/Protected';
export type { ExtendedStackNavigationOptions } from '../fork/native-stack/createStandardNativeStackNavigator';
declare const RNStack: import("react").ForwardRefExoticComponent<Omit<import("../standard-navigation/types").StandardRouterNavigatorProps<StackNavigationState<ParamListBase>, ExtendedStackNavigationOptions, NativeStackNavigationEventMap, NativeStackContentProps, StackRouterOptions>, "children"> & Partial<Pick<import("../standard-navigation/types").StandardRouterNavigatorProps<StackNavigationState<ParamListBase>, ExtendedStackNavigationOptions, NativeStackNavigationEventMap, NativeStackContentProps, StackRouterOptions>, "children">> & import("react").RefAttributes<unknown>> & {
    Screen: (props: import("..").ScreenProps<ExtendedStackNavigationOptions, StackNavigationState<ParamListBase>, NativeStackNavigationEventMap & import("../react-navigation").EventMapBase>) => null;
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
        Title: typeof StackTitle;
        BackButton: typeof import("./stack-utils").StackScreenBackButton;
    };
    Protected: import("react").FunctionComponent<import("../views/Protected").ProtectedProps>;
    Header: typeof import("./stack-utils/StackHeaderComponent").StackHeaderComponent;
    SearchBar: typeof StackSearchBar;
    Title: typeof StackTitle;
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