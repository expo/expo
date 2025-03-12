import { EventMapBase, NavigationState } from '@react-navigation/native';
import React, { FunctionComponent, ComponentType } from 'react';
import { PickPartial } from '../types';
import { ScreenProps } from '../useScreens';
import { ScreenPropsWithName } from './useGroupNavigatorChildren';
import { ScreenRedirectProps } from '../views/ScreenRedirect';
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
export declare function withLayoutContext<TOptions extends object, T extends ComponentType<any>, TState extends NavigationState, TEventMap extends EventMapBase>(Nav: T, processor?: (options: ScreenPropsWithName[]) => ScreenPropsWithName[]): React.ForwardRefExoticComponent<React.PropsWithoutRef<PickPartial<React.ComponentProps<T>, "children">> & React.RefAttributes<unknown>> & {
    Screen: (props: ScreenProps<TOptions, TState, TEventMap>) => null;
    Redirect: FunctionComponent<ScreenRedirectProps>;
};
//# sourceMappingURL=withLayoutContext.d.ts.map