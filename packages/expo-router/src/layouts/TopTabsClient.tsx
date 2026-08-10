'use client';

import type { ComponentProps } from 'react';

import {
  createStandardMaterialTopTabNavigator,
  type MaterialTopTabNavigatorCreateProps,
} from '../react-navigation/material-top-tabs/navigators/createMaterialTopTabNavigator';
import type {
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '../react-navigation/material-top-tabs/types';
import {
  type ParamListBase,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
} from '../react-navigation/native';
import { unstable_integrateWithRouter } from '../standard-navigation';
import {
  appendMissingPlaceholderTabDescriptors,
  appendMissingPlaceholderTabRoutes,
} from '../standard-navigation/appendMissingPlaceholderTabRoutes';

// Keep React Navigation client-only so the entry evaluates in React Server Components.
export * from '../react-navigation/material-top-tabs';

const TopTabs = unstable_integrateWithRouter<
  MaterialTopTabNavigationOptions,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationConfig,
  TabRouterOptions,
  MaterialTopTabNavigatorCreateProps
>(createStandardMaterialTopTabNavigator, TabRouter, {
  processDescriptors: appendMissingPlaceholderTabDescriptors,
  processState: appendMissingPlaceholderTabRoutes,
  createProps: ({ state, dispatch }) => ({
    routeNames: state.routeNames,
    preloadedRouteKeys: state.preloadedRouteKeys,
    preload: (name) => dispatch({ type: 'PRELOAD', payload: { name } }),
  }),
});

export type JSTopTabsProps = ComponentProps<typeof TopTabs>;

export { TopTabs };

export default TopTabs;
