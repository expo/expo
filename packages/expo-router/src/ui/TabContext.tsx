import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import {
  DefaultNavigatorOptions,
  NavigationAction,
  NavigationProp,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';
import { createContext } from 'react';

import { TriggerMap } from './common';

export type ExpoTabsProps = ExpoTabsNavigatorOptions;

export type ExpoTabsNavigatorScreenOptions = {
  detachInactiveScreens?: boolean;
  unmountOnBlur?: boolean;
  freezeOnBlur?: boolean;
  lazy?: boolean;
};

export type ExpoTabsNavigatorOptions = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  TabNavigationState<ParamListBase>,
  ExpoTabsScreenOptions,
  TabNavigationEventMap,
  ExpoTabsNavigationProp<ParamListBase>
> &
  // Should be set through `unstable_settings`
  Omit<TabRouterOptions, 'initialRouteName'> &
  ExpoTabsNavigatorScreenOptions;

export type ExpoTabsNavigationProp<
  ParamList extends ParamListBase,
  RouteName extends keyof ParamList = keyof ParamList,
  NavigatorID extends string | undefined = undefined,
> = NavigationProp<
  ParamList,
  RouteName,
  NavigatorID,
  TabNavigationState<ParamListBase>,
  ExpoTabsScreenOptions,
  TabNavigationEventMap
>;

/**
 * @hidden
 */
export type ExpoTabsScreenOptions = Pick<
  BottomTabNavigationOptions,
  'title' | 'lazy' | 'freezeOnBlur'
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
    ExpoTabsNavigatorScreenOptions,
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
  preloadedRouteKeys: [],
  history: [],
  index: -1,
  key: '',
  stale: false,
  routeNames: [],
  routes: [],
});

export type Route = TabNavigationState<ParamListBase>['routes'][number];
export type TabsDescriptor = TabsContextValue['descriptors'][number];
