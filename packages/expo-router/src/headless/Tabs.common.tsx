import { createContext, useContext } from 'react';
import { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { BottomTabNavigationConfig } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import {
  DefaultNavigatorOptions,
  ParamListBase,
  TabActionHelpers,
  TabNavigationState,
  TabRouterOptions,
  useNavigationBuilder,
} from '@react-navigation/native';

export type TabsProps = DefaultNavigatorOptions<
  ParamListBase,
  TabNavigationState<ParamListBase>,
  TabsScreenOptions,
  TabNavigationEventMap
> &
  Omit<TabRouterOptions, 'initialRouteName'> & // Should be set through `unstable_settings`
  BottomTabNavigationConfig;

export type TabsScreenOptions = BottomTabNavigationOptions;

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
    TabNavigationState<ParamListBase>,
    TabRouterOptions,
    TabActionHelpers<ParamListBase>,
    TabsScreenOptions,
    TabNavigationEventMap
  >
>;

export const TabsContext = createContext<TabsContextValue | null>(null);

export function useTabsContext() {
  const tabsContext = useContext(TabsContext);
  if (!tabsContext) {
    throw new Error('useBuilderContext used');
  }
  return tabsContext;
}

export type Route = TabNavigationState<ParamListBase>['routes'][number];
export type TabsDescriptor = TabsContextValue['descriptors'][number];
