import {
  background,
  Column,
  fillMaxSize,
  NavigationDrawerItem,
  paddingAll,
  size,
  Text,
} from '@expo/ui/jetpack-compose';
import {
  CommonActions,
  DrawerActions,
  type DrawerNavigationState,
  type ParamListBase,
} from '@react-navigation/native';
import * as React from 'react';

import type { DrawerDescriptorMap, DrawerNavigationHelpers } from '../types';

type Props = {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

/**
 * Component that renders the navigation list in the drawer.
 */
export function DrawerItemList({ state, navigation, descriptors }: Props) {
  const focusedRoute = state.routes[state.index];
  const focusedDescriptor = descriptors[focusedRoute.key];
  const focusedOptions = focusedDescriptor.options;

  const routes = state.routes.map((route, i) => {
    const focused = i === state.index;

    const onPress = () => {
      const event = navigation.emit({
        type: 'drawerItemPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        navigation.dispatch({
          ...(focused ? DrawerActions.closeDrawer() : CommonActions.navigate(route)),
          target: state.key,
        });
      }
    };

    const { drawerActiveTintColor, drawerInactiveTintColor } = focusedOptions;

    const {
      title,
      drawerLabel,
      // drawerIcon,
      // drawerLabelStyle,
      // drawerItemStyle,
      // drawerAllowFontScaling,
    } = descriptors[route.key].options;

    const label =
      drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name;
    const color = (focused ? drawerActiveTintColor : drawerInactiveTintColor) ?? '#000000';

    return (
      <NavigationDrawerItem
        onItemClick={onPress}
        selected={focused}
        key={route.key}
        modifiers={[background('#ff0000'), size(200, 200)]}>
        {/* TODO: Add Icons to API using icon = { Icon(...) } */}
        {typeof label === 'string' ? <Text>{label}</Text> : label({ color, focused })}
      </NavigationDrawerItem>
    );
  }) as React.ReactNode as React.ReactElement;

  return <Column modifiers={[fillMaxSize(), paddingAll(16)]}>{routes}</Column>;
}
