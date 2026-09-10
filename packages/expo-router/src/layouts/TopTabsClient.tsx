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
  CommonActions,
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
import type { StandardNavigatorCreatePropsFactoryDeps } from '../standard-navigation/types';
import { createBaseTabProps } from './createBaseTabProps';

// Keep React Navigation client-only so the entry evaluates in React Server Components.
export * from '../react-navigation/material-top-tabs';

/**
 * Creates the props required to integrate Expo Router's JavaScript top tabs navigator.
 *
 * @param dependencies The navigation state and dispatch functions provided to a `createProps`
 * factory.
 * @returns The JavaScript top tabs navigator props.
 *
 * @example
 * ```tsx
 * import { TabRouter, unstable_integrateWithRouter } from 'expo-router';
 * import { createJSTopTabsProps } from 'expo-router/js-top-tabs';
 * import { navigator } from './navigator';
 *
 * export const TopTabs = unstable_integrateWithRouter(navigator, TabRouter, {
 *   createProps: createJSTopTabsProps,
 * });
 * ```
 */
export function createJSTopTabsProps(
  args: StandardNavigatorCreatePropsFactoryDeps<TabNavigationState<ParamListBase>>
): MaterialTopTabNavigatorCreateProps {
  const { dispatchSync } = args;
  return {
    ...createBaseTabProps(args),
    navigateToTabSync: (name, params) => dispatchSync(CommonActions.navigate(name, params)),
  };
}

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
  createProps: createJSTopTabsProps,
});

export type JSTopTabsProps = ComponentProps<typeof TopTabs>;

export { TopTabs };

export default TopTabs;
