import { EventMapBase, NavigationState } from '@react-navigation/native';
import React, {
  FunctionComponent,
  forwardRef,
  ComponentProps,
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes,
} from 'react';

import { useContextKey } from '../Route';
import { PickPartial } from '../types';
import { ScreenProps } from '../useScreens';
import { ScreenPropsWithName, useGroupNavigatorChildren } from './useGroupNavigatorChildren';
import { Screen } from '../views/Screen';
import { ScreenRedirect, ScreenRedirectProps } from '../views/ScreenRedirect';

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
export function withLayoutContext<
  TOptions extends object,
  T extends ComponentType<any>,
  TState extends NavigationState,
  TEventMap extends EventMapBase,
>(Nav: T, processor?: (options: ScreenPropsWithName[]) => ScreenPropsWithName[]) {
  return Object.assign(
    forwardRef(({ children: userDefinedChildren, ...props }: any, ref) => {
      const contextKey = useContextKey();

      debugger;

      const { children } = useGroupNavigatorChildren(userDefinedChildren, {
        contextKey,
        processor,
      });

      console.log(children);

      // Prevent throwing an error when there are no screens.
      if (!children.length) {
        return null;
      }

      return <Nav {...props} id={contextKey} ref={ref} children={children} />;
    }),
    {
      Screen,
      Redirect: ScreenRedirect,
    }
  ) as ForwardRefExoticComponent<
    PropsWithoutRef<PickPartial<ComponentProps<T>, 'children'>> & RefAttributes<unknown>
  > & {
    Screen: (props: ScreenProps<TOptions, TState, TEventMap>) => null;
    Redirect: FunctionComponent<ScreenRedirectProps>;
  };
}
