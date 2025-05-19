'use client';

import {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import React, { ComponentProps } from 'react';
import { Pressable, Platform } from 'react-native';

import { withLayoutContext } from './withLayoutContext';
import { Link } from '../link/Link';
import { Href } from '../types';
import { tabRouterOverride } from './TabRouter';

// This is the only way to access the navigator.
const BottomTabNavigator = createBottomTabNavigator().Navigator;

export type BottomTabNavigator = typeof BottomTabNavigator;

type TabsProps = BottomTabNavigationOptions & { href?: Href | null };

const ExpoTabs = withLayoutContext<
  TabsProps,
  typeof BottomTabNavigator,
  TabNavigationState<ParamListBase>,
  BottomTabNavigationEventMap
>(BottomTabNavigator, (screens) => {
  // Support the `href` shortcut prop.
  return screens.map((screen) => {
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
          // @ts-expect-error: TODO(@kitten): This isn't properly typed
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
  });
});

const Tabs = Object.assign(
  (props: ComponentProps<typeof ExpoTabs>) => {
    return <ExpoTabs {...props} UNSTABLE_router={tabRouterOverride} />;
  },
  {
    Screen: ExpoTabs.Screen,
  }
);

export default Tabs;
