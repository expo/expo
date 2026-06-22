'use client';
import * as React from 'react';

import { useStableTabOrder } from '../../core/useStableTabOrder';
import {
  CommonActions,
  type DrawerNavigationState,
  type ParamListBase,
  useLinkBuilder,
} from '../../native';
import type { DrawerDescriptorMap, DrawerNavigationHelpers } from '../types';
import { DrawerItem } from './DrawerItem';
import { useDrawerActions } from '../utils/useDrawerActions';

type Props = {
  state: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
  descriptors: DrawerDescriptorMap;
};

/**
 * Component that renders the navigation list in the drawer.
 */
export function DrawerItemList({ state, navigation, descriptors }: Props) {
  const { buildHref } = useLinkBuilder();
  const { closeDrawer } = useDrawerActions();

  const focusedRoute = state.routes[state.index]!;
  const focusedDescriptor = descriptors[focusedRoute!.key]!;
  const focusedOptions = focusedDescriptor.options;

  const {
    drawerActiveTintColor,
    drawerInactiveTintColor,
    drawerActiveBackgroundColor,
    drawerInactiveBackgroundColor,
  } = focusedOptions;

  // `state.routes` is ordered by the navigator's back stack; render the drawer items
  // in stable declaration order and detect focus by key.
  const orderedRoutes = useStableTabOrder(state);

  return orderedRoutes.map((route) => {
    const focused = route.key === focusedRoute.key;

    const onPress = () => {
      const event = navigation.emit({
        type: 'drawerItemPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!event.defaultPrevented) {
        if (focused) {
          // Tapping the focused route just closes the drawer; navigating elsewhere closes it via
          // the navigator's navigate-close effect.
          closeDrawer();
        } else {
          navigation.dispatch({
            ...CommonActions.navigate(route),
            target: state.key,
          });
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
