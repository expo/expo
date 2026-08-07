'use client';
// TODO: Rename this file to `createStandardDrawerNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { StandardNavigatorContentProps } from '../../../standard-navigation/types';
import { usePreloadPlaceholderRoutes } from '../../../standard-navigation/usePreloadPlaceholderRoutes';
import { useVisibleTabsWithRedirect } from '../../../standard-navigation/useVisibleTabsWithRedirect';
import type { DrawerNavigationState, ParamListBase, RenderState } from '../../native';
import type {
  DrawerDescriptorMap,
  DrawerNavigationConfig,
  DrawerNavigationEventMap,
  DrawerNavigationHelpers,
  DrawerNavigationOptions,
} from '../types';
import { DrawerView } from '../views/DrawerView';

export interface DrawerNavigatorCreateProps {
  drawerState: RenderState<DrawerNavigationState<ParamListBase>>;
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
}: ContentArgs) {
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
  });

  if (visibleRoutes.length === 0 || focusedIndex < 0) {
    return null;
  }

  return (
    <DrawerView
      state={
        // Visible routes originate from keyed render state or keyed placeholders.
        { ...drawerState, routes: visibleRoutes, index: focusedIndex } as RenderState<
          DrawerNavigationState<ParamListBase>
        >
      }
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
