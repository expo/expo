import { ReactNode, ReactElement, ComponentProps } from 'react';
import { View, PressableProps } from 'react-native';
import { ExpoTabActionType } from './TabRouter';
import { Href } from '../types';
type PressablePropsWithoutFunctionChildren = Omit<PressableProps, 'children'> & {
    children?: ReactNode | undefined;
};
export type TabTriggerProps<T extends string | object> = PressablePropsWithoutFunctionChildren & {
    name: string;
    href?: Href<T>;
    /** Forward props to child component. Useful for custom wrappers. */
    asChild?: boolean;
    /** Reset the route when switching to the tab */
    reset?: SwitchToOptions['reset'] | 'onLongPress';
};
export type TabTriggerOptions<T extends string | object> = {
    name: string;
    href: Href<T>;
};
export type TabTriggerSlotProps = PressablePropsWithoutFunctionChildren & React.RefAttributes<View> & {
    isFocused?: boolean;
    href: string;
};
export declare function TabTrigger<T extends string | object>({ asChild, name, href, reset, ...props }: TabTriggerProps<T>): import("react").JSX.Element;
export declare function isTabTrigger(child: ReactElement<any>): child is ReactElement<ComponentProps<typeof TabTrigger>>;
export type SwitchToOptions = Omit<Extract<ExpoTabActionType, {
    type: 'SWITCH_TABS';
}>['payload'], 'name'>;
export declare function useTabTrigger(): {
    switchTab: (name: string, options?: SwitchToOptions) => void;
    isFocused: (name: string) => boolean;
    getTrigger: (name: string) => ({
        type: "internal";
        name: string;
        href: string;
        routeNode: import("../Route").RouteNode;
        action: import("@react-navigation/native").TabActionType;
    } | {
        type: "external";
        name: string;
        href: string;
    }) & {
        index: number;
    };
};
export {};
//# sourceMappingURL=TabTrigger.d.ts.map