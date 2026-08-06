'use client';
// TODO: Rename this file to `createStandardDrawerNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { StandardNavigatorContentProps } from '../../../standard-navigation/types';
import { useVisibleTabsWithRedirect } from '../../../standard-navigation/useVisibleTabsWithRedirect';
import type { DrawerNavigationState, ParamListBase } from '../../native';
import type {
  DrawerDescriptorMap,
  DrawerNavigationConfig,
  DrawerNavigationEventMap,
  DrawerNavigationHelpers,
  DrawerNavigationOptions,
} from '../types';
import { DrawerView } from '../views/DrawerView';

export interface DrawerNavigatorCreateProps {
  drawerState: DrawerNavigationState<ParamListBase>;
  navigation: DrawerNavigationHelpers;
}

export interface DrawerNavigatorConfig extends DrawerNavigationConfig {
  defaultStatus?: 'open' | 'closed';
}

export type DrawerNavigatorContentProps = DrawerNavigatorConfig & DrawerNavigatorCreateProps;

export type StandardDrawerNavigationEventMap = {
  [Event in keyof DrawerNavigationEventMap]: DrawerNavigationEventMap[Event] & {
    canPreventDefault: Event extends 'drawerItemPress' ? true : false;
  };
};

type ContentArgs = StandardNavigatorContentProps<
  DrawerNavigationOptions,
  StandardDrawerNavigationEventMap,
  DrawerNavigatorContentProps
>;

function DrawerNavigatorContent({
  descriptors,
  drawerState,
  navigation,
  defaultStatus = 'closed',
  drawerContent,
  detachInactiveScreens,
}: ContentArgs) {
  const { visibleRoutes, focusedIndex } = useVisibleTabsWithRedirect({
    routes: drawerState.routes,
    routeNames: drawerState.routeNames,
    focusedRouteKey: drawerState.routes[drawerState.index]!.key,
    descriptors,
  });

  if (visibleRoutes.length === 0) {
    return null;
  }

  return (
    <DrawerView
      state={{
        ...drawerState,
        routes: visibleRoutes,
        index: focusedIndex,
      }}
      navigation={navigation}
      // TODO(@ubax): SDK-58: Try to remove the casting from here to ensure type safety
      // Integration supplies full descriptors, including preload placeholders; standard types omit route/navigation.
      descriptors={descriptors as unknown as DrawerDescriptorMap}
      defaultStatus={defaultStatus}
      drawerContent={drawerContent}
      detachInactiveScreens={detachInactiveScreens}
    />
  );
}

export const createStandardDrawerNavigator = createStandardNavigator<
  DrawerNavigationOptions,
  StandardDrawerNavigationEventMap,
  DrawerNavigatorContentProps
>(DrawerNavigatorContent);
