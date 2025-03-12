import { EventMapBase, NavigationState } from '@react-navigation/native';
import React, { ComponentType, ReactNode } from 'react';
import { PickPartial } from '../types';
import { ScreenProps } from '../useScreens';
export declare function useFilterScreenChildren(children: ReactNode, { isCustomNavigator, contextKey, }?: {
    isCustomNavigator?: boolean;
    /** Used for sending developer hints */
    contextKey?: string;
}): {
    screens: ScreenProps[] | undefined;
    children: any[];
};
/**
 * Returns a navigator that automatically injects matched routes and renders nothing when there are no children.
 * Return type with `children` prop optional.
 *
 * Enables use of other built-in React Navigation navigators and other navigators built with the React Navigation custom navigator API.
 *
 *  @example
 * ```tsx app/_layout.tsx
 * import { ParamListBase, TabNavigationState } from "@react-navigation/native";
 * import {
 *   createMaterialTopTabNavigator,
 *   MaterialTopTabNavigationOptions,
 *   MaterialTopTabNavigationEventMap,
 * } from "@react-navigation/material-top-tabs";
 * import { withLayoutContext } from "expo-router";
 *
 * const MaterialTopTabs = createMaterialTopTabNavigator();
 *
 * const ExpoRouterMaterialTopTabs = withLayoutContext<
 *   MaterialTopTabNavigationOptions,
 *   typeof MaterialTopTabs.Navigator,
 *   TabNavigationState<ParamListBase>,
 *   MaterialTopTabNavigationEventMap
 * >(MaterialTopTabs.Navigator);

 * export default function TabLayout() {
 *   return <ExpoRouterMaterialTopTabs />;
 * }
 * ```
 */
export declare function withLayoutContext<TOptions extends object, T extends ComponentType<any>, TState extends NavigationState, TEventMap extends EventMapBase>(Nav: T, processor?: (options: ScreenProps[]) => ScreenProps[]): React.ForwardRefExoticComponent<React.PropsWithoutRef<PickPartial<React.ComponentProps<T>, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: ScreenProps<TOptions, TState, TEventMap>) => null;
};
//# sourceMappingURL=withLayoutContext.d.ts.map