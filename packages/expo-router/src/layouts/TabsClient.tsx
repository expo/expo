'use client';

import type { ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';

import { Link } from '../link/Link';
import {
  createStandardBottomTabNavigator,
  type BottomTabNavigatorCreateProps,
  type TabsScreenOptions,
} from '../react-navigation/bottom-tabs/navigators/createBottomTabNavigator';
import type {
  BottomTabNavigationConfig,
  BottomTabNavigationEventMap,
} from '../react-navigation/bottom-tabs/types';
import {
  StackActions,
  TabRouter,
  type ParamListBase,
  type TabNavigationState,
  type TabRouterOptions,
} from '../react-navigation/native';
import { unstable_integrateWithRouter } from '../standard-navigation';

/**
 * Renders a tabs navigator.
 *
 * @hideType
 */
const Tabs = unstable_integrateWithRouter<
  TabsScreenOptions,
  TabNavigationState<ParamListBase>,
  BottomTabNavigationEventMap,
  BottomTabNavigationConfig,
  TabRouterOptions,
  BottomTabNavigatorCreateProps
>(createStandardBottomTabNavigator, TabRouter, {
  createProps: ({ state, dispatch }) => ({
    preloadedRouteKeys: state.preloadedRouteKeys,
    popNestedStackToTop: (routeKey) => {
      const nestedState = state.routes.find((route) => route.key === routeKey)?.state;
      if (nestedState?.type === 'stack' && nestedState.key) {
        dispatch({ ...StackActions.popToTop(), target: nestedState.key });
      }
    },
  }),
  // Support the `href` shortcut prop.
  processScreens: (screens) =>
    screens.map((screen) => {
      if (typeof screen.options !== 'function' && screen.options?.href !== undefined) {
        const { href, ...options } = screen.options;
        if (options.tabBarButton) {
          throw new Error('Cannot use `href` and `tabBarButton` together.');
        }
        return {
          ...screen,
          options: {
            ...options,
            tabBarItemStyle: href == null ? { display: 'none' } : options.tabBarItemStyle,
            tabBarButton: (props) => {
              if (href == null) {
                return null;
              }
              const children =
                Platform.OS === 'web' ? props.children : <Pressable>{props.children}</Pressable>;
              // TODO: React Navigation types these props as Animated.WithAnimatedValue<StyleProp<ViewStyle>>
              //       While Link expects a TextStyle. We need to reconcile these types.
              return (
                <Link
                  {...(props as any)}
                  style={[{ display: 'flex' }, props.style as any]}
                  href={href}
                  asChild={Platform.OS !== 'web'}
                  children={children}
                />
              );
            },
          },
        };
      }
      return screen;
    }),
});

export type BottomTabNavigatorProps = ComponentProps<typeof Tabs>;

export default Tabs;
