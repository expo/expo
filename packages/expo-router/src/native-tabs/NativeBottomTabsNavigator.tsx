'use client';

import {
  createNavigatorFactory,
  NavigationState,
  ParamListBase,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
  type EventMapBase,
} from '@react-navigation/native';
import React, { use, useCallback, useMemo } from 'react';

import { NativeBottomTabsRouter } from './NativeBottomTabsRouter';
import { NativeTabTrigger } from './NativeTabTrigger';
import { NativeTabsView } from './NativeTabsView';
import type {
  InternalNativeTabsProps,
  NativeTabOptions,
  NativeTabsProps,
  NativeTabsViewTabItem,
} from './types';
import { convertIconColorPropToObject, convertLabelStylePropToObject } from './utils';
import { withLayoutContext } from '../layouts/withLayoutContext';
import { getPathFromState } from '../link/linking';
import { getAllChildrenNotOfType, getAllChildrenOfType } from '../utils/children';

// In Jetpack Compose, the default back behavior is to go back to the initial route.
const defaultBackBehavior = 'initialRoute';
export const NativeTabsContext = React.createContext<boolean>(false);

export function NativeTabsNavigator({
  children,
  backBehavior = defaultBackBehavior,
  labelStyle,
  iconColor,
  blurEffect,
  backgroundColor,
  badgeBackgroundColor,
  indicatorColor,
  badgeTextColor,
  shadowColor,
  ...rest
}: InternalNativeTabsProps) {
  if (use(NativeTabsContext)) {
    throw new Error(
      'Nesting Native Tabs inside each other is not supported natively. Use JS tabs for nesting instead.'
    );
  }

  const processedLabelStyle = convertLabelStylePropToObject(labelStyle);
  const processedIconColor = convertIconColorPropToObject(iconColor);

  const selectedLabelStyle = processedLabelStyle.selected
    ? {
        ...processedLabelStyle.selected,
        color: processedLabelStyle.selected.color ?? rest.tintColor,
      }
    : rest.tintColor
      ? { color: rest.tintColor }
      : undefined;

  const { state, descriptors, navigation, NavigationContent } = useNavigationBuilder<
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    Record<string, (...args: any) => void>,
    NativeTabOptions,
    Record<string, any>
  >(NativeBottomTabsRouter, {
    children,
    backBehavior,
    screenOptions: {
      disableTransparentOnScrollEdge: rest.disableTransparentOnScrollEdge,
      labelStyle: processedLabelStyle.default,
      selectedLabelStyle,
      iconColor: processedIconColor.default,
      selectedIconColor: processedIconColor.selected ?? rest.tintColor,
      blurEffect,
      backgroundColor,
      badgeBackgroundColor,
      indicatorColor,
      badgeTextColor,
      shadowColor,
    },
  });

  const { routes } = state;

  const visibleTabs = useMemo(
    () =>
      routes
        // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
        // If it is not defined, then it was not specified, and we should hide the tab.
        .filter((route) => descriptors[route.key].options?.hidden !== true)
        .map(
          (route): NativeTabsViewTabItem => ({
            options: descriptors[route.key].options,
            routeKey: route.key,
            name: route.name,
            contentRenderer: () => descriptors[route.key].render(),
          })
        ),
    [routes, descriptors]
  );
  const visibleFocusedTabIndex = useMemo(
    () => visibleTabs.findIndex((tab) => tab.routeKey === routes[state.index].key),
    [visibleTabs, routes, state.index]
  );
  const visibleTabsKeys = useMemo(
    () => visibleTabs.map((tab) => tab.routeKey).join(';'),
    [visibleTabs]
  );

  if (visibleFocusedTabIndex < 0) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(
        `The focused tab in NativeTabsView cannot be displayed. Make sure path is correct and the route is not hidden. Path: "${getPathFromState(state)}"`
      );
    }
  }
  const focusedIndex = visibleFocusedTabIndex >= 0 ? visibleFocusedTabIndex : 0;

  const onTabChange = useCallback(
    (tabKey: string) => {
      const descriptor = descriptors[tabKey];
      const route = descriptor.route;
      navigation.emit({
        type: 'tabPress',
        target: tabKey,
        data: {
          __internalTabsType: 'native',
        },
      });
      navigation.dispatch({
        type: 'JUMP_TO',
        target: state.key,
        payload: {
          name: route.name,
        },
      });
    },
    [descriptors, navigation, state.key]
  );

  return (
    <NavigationContent>
      <NativeTabsContext value>
        <NativeTabsView
          {...rest}
          key={visibleTabsKeys}
          focusedIndex={focusedIndex}
          tabs={visibleTabs}
          onTabChange={onTabChange}
        />
      </NativeTabsContext>
    </NavigationContent>
  );
}

const createNativeTabNavigator = createNavigatorFactory(NativeTabsNavigator);

const NativeTabsNavigatorWithContext = withLayoutContext<
  NativeTabOptions,
  typeof NativeTabsNavigator,
  NavigationState,
  EventMapBase
>(createNativeTabNavigator().Navigator, undefined, true);

export function NativeTabsNavigatorWrapper(props: NativeTabsProps) {
  const triggerChildren = useMemo(
    () => getAllChildrenOfType(props.children, NativeTabTrigger),
    [props.children]
  );
  const nonTriggerChildren = useMemo(
    () => getAllChildrenNotOfType(props.children, NativeTabTrigger),
    [props.children]
  );

  return (
    <NativeTabsNavigatorWithContext
      {...props}
      children={triggerChildren}
      nonTriggerChildren={nonTriggerChildren}
    />
  );
}
