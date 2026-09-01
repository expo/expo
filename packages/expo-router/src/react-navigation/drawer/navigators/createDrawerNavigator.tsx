'use client';
// TODO: Rename this file to `createStandardDrawerNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { StandardNavigatorContentProps } from '../../../standard-navigation/types';
import { usePreloadPlaceholderRoutes } from '../../../standard-navigation/usePreloadPlaceholderRoutes';
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
  preload: (name: string) => void;
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
  preload,
  defaultStatus = 'closed',
  drawerContent,
  detachInactiveScreens,
  ...rest
}: ContentArgs) {
  const { backBehavior } = rest as typeof rest & { backBehavior?: string };
  const { visibleRoutes, focusedIndex } = useVisibleTabsWithRedirect({
    routes: drawerState.routes,
    routeNames: drawerState.routeNames,
    focusedRouteKey: drawerState.routes[drawerState.index]?.key,
    descriptors,
  });
  // TODO(@ubax): SDK-58: Try to remove the casting from here to ensure type safety
  // Integration supplies full descriptors, including preload placeholders; standard types omit route/navigation.
  const drawerDescriptors = descriptors as unknown as DrawerDescriptorMap;

  usePreloadPlaceholderRoutes({
    routes: visibleRoutes,
    descriptors: drawerDescriptors,
    preload,
    lazyByDefault: true,
    preloadAll: backBehavior === 'order',
  });

  if (visibleRoutes.length === 0 || focusedIndex < 0) {
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
      descriptors={drawerDescriptors}
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
