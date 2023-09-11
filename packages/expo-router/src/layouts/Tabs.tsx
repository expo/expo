import {
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import { ParamListBase, TabNavigationState } from '@react-navigation/native';
import React from 'react';
import { Pressable, Platform } from 'react-native';

import { withLayoutContext } from './withLayoutContext';
import { Link } from '../link/Link';
import { Href } from '../link/href';

// This is the only way to access the navigator.
const BottomTabNavigator = createBottomTabNavigator().Navigator;

export const Tabs = withLayoutContext<
  BottomTabNavigationOptions & { href?: Href | null },
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
          tabBarButton: (props) => {
            if (href == null) {
              return null;
            }
            const children =
              Platform.OS === 'web' ? props.children : <Pressable>{props.children}</Pressable>;
            return (
              <Link
                {...props}
                style={[{ display: 'flex' }, props.style]}
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

export default Tabs;
