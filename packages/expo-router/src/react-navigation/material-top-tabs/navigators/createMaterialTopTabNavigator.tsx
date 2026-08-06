'use client';
// TODO: Rename this file to `createStandardMaterialTopTabNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { NavigatorContentProps } from '../../../standard-navigation/types';
import { useVisibleTabsWithRedirect } from '../../../standard-navigation/useVisibleTabsWithRedirect';
import type {
  MaterialTopTabDescriptorMap,
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '../types';
import { MaterialTopTabView } from '../views/MaterialTopTabView';

export interface MaterialTopTabNavigatorCreateProps {
  routeNames: string[];
  preloadedRouteKeys: string[];
}

export type MaterialTopTabNavigatorContentProps = MaterialTopTabNavigationConfig &
  MaterialTopTabNavigatorCreateProps;

type ContentArgs = NavigatorContentProps<
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigatorCreateProps
>;

function MaterialTopTabNavigatorContent({
  state,
  descriptors,
  actions,
  emitter,
  routeNames,
  preloadedRouteKeys,
  ...rest
}: ContentArgs) {
  const { visibleRoutes, focusedIndex } = useVisibleTabsWithRedirect({
    routes: state.routes,
    routeNames,
    focusedRouteKey: state.routes[state.index]?.key,
    descriptors,
  });
  const navigateToTab = (routeKey: string) => {
    const route = state.routes.find((route) => route.key === routeKey);
    if (route) {
      actions.navigate(route.name, route.params);
    } else if (__DEV__) {
      console.warn(
        `Top tabs could not switch to the tab "${routeKey}" because no tab with that key exists. ` +
          `'navigateToTab' takes a route key, not a route name — pass 'route.key' from the tab bar props.`
      );
    }
  };

  if (visibleRoutes.length === 0) {
    return null;
  }

  return (
    <MaterialTopTabView
      {...rest}
      state={{
        ...state,
        routes: visibleRoutes,
        index: focusedIndex,
      }}
      // TODO(@ubax): SDK-58: Try to remove the casting from here to ensure type safety
      // Integration supplies full descriptors, including preload placeholders; standard types omit route/navigation.
      descriptors={descriptors as unknown as MaterialTopTabDescriptorMap}
      emitter={emitter}
      navigateToTab={navigateToTab}
      preloadedRouteKeys={preloadedRouteKeys}
    />
  );
}

export const createStandardMaterialTopTabNavigator = createStandardNavigator<
  MaterialTopTabNavigationOptions,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigatorContentProps
>(MaterialTopTabNavigatorContent);
