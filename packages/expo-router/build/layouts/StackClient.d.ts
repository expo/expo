import { StackRouter as RNStackRouter } from '@react-navigation/native';
import React, { ComponentProps } from 'react';
import { type ExtendedStackNavigationOptions, type StackScreenProps, StackSearchBar } from './stack-utils';
import { Protected } from '../views/Protected';
export type { ExtendedStackNavigationOptions };
declare const RNStack: React.ForwardRefExoticComponent<Omit<import("..").PickPartial<any, "children">, "ref"> & React.RefAttributes<unknown>> & {
    Screen: (props: import("../useScreens").ScreenProps<any, StackNavigationState<ParamListBase>, NativeStackNavigationEventMap>) => null;
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
declare const Stack: ((props: ComponentProps<typeof RNStack>) => React.JSX.Element) & {
    Screen: (({ children, options, ...rest }: StackScreenProps) => React.JSX.Element) & {
        Title: typeof import("./stack-utils").StackScreenTitle;
        BackButton: typeof import("./stack-utils").StackScreenBackButton;
    };
    Protected: React.FunctionComponent<import("../views/Protected").ProtectedProps>;
    Header: typeof import("./stack-utils/StackHeaderComponent").StackHeaderComponent;
    SearchBar: typeof StackSearchBar;
    Toolbar: {
        (props: import("./stack-utils").StackToolbarProps): React.JSX.Element;
        Button: React.FC<import("./stack-utils").StackToolbarButtonProps>;
        Menu: React.FC<import("./stack-utils").StackToolbarMenuProps>;
        MenuAction: React.FC<import("./stack-utils").StackToolbarMenuActionProps>;
        SearchBarSlot: React.FC<import("./stack-utils").StackToolbarSearchBarSlotProps>;
        Spacer: React.FC<import("./stack-utils").StackToolbarSpacerProps>;
        View: React.FC<import("./stack-utils").StackToolbarViewProps>;
        Label: React.FC<import("./stack-utils").StackToolbarLabelProps>;
        Icon: React.FC<import("./stack-utils").StackToolbarIconProps>;
        Badge: React.FC<import("./stack-utils").StackToolbarBadgeProps>;
    };
};
export default Stack;
export declare const StackRouter: typeof RNStackRouter;
//# sourceMappingURL=StackClient.d.ts.map