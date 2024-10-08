import {
  BottomTabNavigationOptions,
  BottomTabNavigationConfig,
} from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import {
  DefaultNavigatorOptions,
  NavigationAction,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { createContext } from 'react';

import { TriggerMap } from './common';

export type ExpoTabsProps = DefaultNavigatorOptions<
  ParamListBase,
  TabNavigationState<ParamListBase>,
  ExpoTabsScreenOptions,
  TabNavigationEventMap
> &
  Omit<TabRouterOptions, 'initialRouteName'> & // Should be set through `unstable_settings`
  BottomTabNavigationConfig;

/**
 * @hidden
 */
export type ExpoTabsScreenOptions = Pick<
  BottomTabNavigationOptions,
  'title' | 'lazy' | 'unmountOnBlur' | 'freezeOnBlur'
> & {
  params?: object;
  title: string;
  action: NavigationAction;
};

/**
 * @hidden
 */
export type TabNavigationEventMap = {
  /**
   * Event which fires on tapping on the tab in the tab bar.
   */
  tabPress: { data: undefined; canPreventDefault: true };
  /**
   * Event which fires on long press on the tab in the tab bar.
   */
  tabLongPress: { data: undefined };
};

/**
 * The React Navigation custom navigator
 * @see https://reactnavigation.org/docs/custom-navigators/#usenavigationbuilder
 */
export type TabsContextValue = ReturnType<
  typeof useNavigationBuilder<
    TabNavigationState<any>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    BottomTabNavigationOptions,
    TabNavigationEventMap
  >
>;

export type TabContextValue = TabsDescriptor['options'];

export const TabContext = createContext<TabContextValue>({});
/**
 * @hidden
 */
export const TabTriggerMapContext = createContext<TriggerMap>({});
/**
 * @hidden
 */
export const TabsDescriptorsContext = createContext<TabsContextValue['descriptors']>({});
/**
 * @hidden
 */
export const TabsNavigatorContext = createContext<TabsContextValue['navigation'] | null>(null);
/**
 * @hidden
 */
export const TabsStateContext = createContext<TabsContextValue['state']>({
  type: 'tab',
  history: [],
  index: -1,
  key: '',
  stale: false,
  routeNames: [],
  routes: [],
});

export type Route = TabNavigationState<ParamListBase>['routes'][number];
export type TabsDescriptor = TabsContextValue['descriptors'][number];
