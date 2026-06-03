'use client';
import * as React from 'react';

import { useLinkBuilder } from '../../native';
import type { DrawerContentComponentProps } from '../types';
import { DrawerItem } from './DrawerItem';

/**
 * Component that renders the navigation list in the drawer.
 */
export function DrawerItemList({
  state,
  descriptors,
  emit,
  navigate,
  closeDrawer,
}: DrawerContentComponentProps) {
  const { buildHref } = useLinkBuilder();

  const focusedRoute = state.routes[state.index]!;
  const focusedDescriptor = descriptors[focusedRoute!.key]!;
  const focusedOptions = focusedDescriptor.options;

  const {
    drawerActiveTintColor,
    drawerInactiveTintColor,
    drawerActiveBackgroundColor,
    drawerInactiveBackgroundColor,
  } = focusedOptions;

  return state.routes.map((route, i) => {
    const focused = i === state.index;

    const onPress = () => {
      const event = emit({
        type: 'drawerItemPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        if (focused) {
          closeDrawer();
        } else {
          navigate(route.name, route.params);
        }
      }
    };

    const {
      title,
      drawerLabel,
      drawerIcon,
      drawerLabelStyle,
      drawerItemStyle,
      drawerAllowFontScaling,
    } = descriptors[route.key]!.options;

    return (
      <DrawerItem
        key={route.key}
        route={route}
        href={buildHref(route.name, route.params)}
        label={drawerLabel !== undefined ? drawerLabel : title !== undefined ? title : route.name}
        icon={drawerIcon}
        focused={focused}
        activeTintColor={drawerActiveTintColor}
        inactiveTintColor={drawerInactiveTintColor}
        activeBackgroundColor={drawerActiveBackgroundColor}
        inactiveBackgroundColor={drawerInactiveBackgroundColor}
        allowFontScaling={drawerAllowFontScaling}
        labelStyle={drawerLabelStyle}
        style={drawerItemStyle}
        onPress={onPress}
      />
    );
  }) as React.ReactNode as React.ReactElement;
}
