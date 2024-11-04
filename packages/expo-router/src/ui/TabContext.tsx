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

export type ExpoTabsScreenOptions = ExpoTabsNavigatorScreenOptions & {
  params?: object;
  title: string;
  action: NavigationAction;
};

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
export const TabTriggerMapContext = createContext<TriggerMap>({});

export type Route = TabNavigationState<ParamListBase>['routes'][number];
export type TabsDescriptor = TabsContextValue['descriptors'][number];
