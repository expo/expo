import { TabNavigationState } from '@react-navigation/native';
import { ReactNode, ReactElement, ComponentProps } from 'react';
import { View, PressableProps } from 'react-native';
import type { TriggerMap } from './common';
import type { Href } from '../types';
type PressablePropsWithoutFunctionChildren = Omit<PressableProps, 'children'> & {
    children?: ReactNode | undefined;
};
export type TabTriggerProps = PressablePropsWithoutFunctionChildren & {
    /**
     *  Name of tab. When used within a `TabList` this sets the name of the tab.
     * Otherwise, this references the name.
     */
    name: string;
    /**
     * Name of tab. Required when used within a `TabList`.
     */
    href?: Href | undefined;
    /**
     * Forward props to child component. Useful for custom wrappers.
     */
    asChild?: boolean | undefined;
    /**
     * Resets the route when switching to a tab.
     */
    resetOnFocus?: boolean | undefined;
};
export type TabTriggerOptions = {
    name: string;
    href: Href;
};
export type TabTriggerSlotProps = PressablePropsWithoutFunctionChildren & React.RefAttributes<View> & {
    isFocused?: boolean | undefined;
    href?: string | undefined;
};
/**
 * Creates a trigger to navigate to a tab. When used as child of `TabList`, its
 * functionality slightly changes since the `href` prop is required,
 * and the trigger also defines what routes are present in the `Tabs`.
 *
 * When used outside of `TabList`, this component no longer requires an `href`.
 *
 * @example
 * ```tsx
 * <Tabs>
 *  <TabSlot />
 *  <TabList>
 *   <TabTrigger name="home" href="/" />
 *  </TabList>
 * </Tabs>
 * ```
 */
export declare function TabTrigger({ asChild, name, href, resetOnFocus, ...props }: TabTriggerProps): import("react").JSX.Element;
/**
 * @hidden
 */
export declare function isTabTrigger(child: ReactElement<any>): child is ReactElement<ComponentProps<typeof TabTrigger>>;
/**
 * Options for `switchTab` function.
 */
export type SwitchToOptions = {
    /**
     * Navigate and reset the history on route focus.
     */
    resetOnFocus?: boolean | undefined;
};
export type Trigger = TriggerMap[string] & {
    isFocused: boolean;
    resolvedHref: string;
    route: TabNavigationState<any>['routes'][number];
};
export type UseTabTriggerResult = {
    switchTab: (name: string, options: SwitchToOptions) => void;
    getTrigger: (name: string) => Trigger | undefined;
    trigger?: Trigger | undefined;
    triggerProps: TriggerProps;
};
export type TriggerProps = {
    isFocused: boolean;
    onPress: PressableProps['onPress'];
    onLongPress: PressableProps['onLongPress'];
};
/**
 * Utility hook creating custom `TabTrigger`.
 */
export declare function useTabTrigger(options: TabTriggerProps): UseTabTriggerResult;
export {};
//# sourceMappingURL=TabTrigger.d.ts.map