'use client';

import type { ComponentProps } from 'react';
import { Platform, Pressable } from 'react-native';

import { Link } from '../link/Link';
import {
  createStandardBottomTabNavigator,
  type BottomTabNavigatorCreateProps,
} from '../react-navigation/bottom-tabs/navigators/createBottomTabNavigator';
import type {
  BottomTabNavigationConfig,
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from '../react-navigation/bottom-tabs/types';
import {
  StackActions,
  TabRouter,
  type ParamListBase,
  type TabNavigationState,
  type TabRouterOptions,
} from '../react-navigation/native';
import { unstable_integrateWithRouter } from '../standard-navigation';
import {
  appendMissingPlaceholderTabDescriptors,
  appendMissingPlaceholderTabRoutes,
} from '../standard-navigation/appendMissingPlaceholderTabRoutes';
import type { Href } from '../types';

// Keep React Navigation client-only so the entry evaluates in React Server Components.
export * from '../react-navigation/bottom-tabs';

export type TabsScreenOptions = BottomTabNavigationOptions & {
  // TODO: Consider deprecating `href`.
  href?: Href | null;
};

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
  processDescriptors: appendMissingPlaceholderTabDescriptors,
  processState: appendMissingPlaceholderTabRoutes,
  createProps: ({ state, dispatch }) => ({
    routeNames: state.routeNames,
    preloadedRouteKeys: state.preloadedRouteKeys,
    preload: (name) => dispatch({ type: 'PRELOAD', payload: { name } }),
    popNestedStackToTop: (routeKey) => {
      const nestedState = state.routes.find((route) => route.key === routeKey)?.state;
      // A targeted POP_TO_TOP is a no-op for nested navigators that are not stacks.
      if (nestedState?.key) {
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
        if (href === null) {
          // TODO(@ubax): Update the hiding-a-tab guide for the new redirect behavior.
          return {
            ...screen,
            options: {
              ...options,
              hidden: true,
            },
          };
        }
        return {
          ...screen,
          options: {
            ...options,
            tabBarButton: (props) => {
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

export type JSTabsProps = ComponentProps<typeof Tabs>;

export default Tabs;
