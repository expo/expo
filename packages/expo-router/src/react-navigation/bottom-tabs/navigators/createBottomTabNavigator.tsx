'use client';
// TODO: Rename this file to `createStandardBottomTabNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { NavigatorContentProps } from '../../../standard-navigation/types';
import { useVisibleTabsWithRedirect } from '../../../standard-navigation/useVisibleTabsWithRedirect';
import type {
  BottomTabDescriptorMap,
  BottomTabNavigationConfig,
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from '../types';
import { BottomTabView } from '../views/BottomTabView';

export interface BottomTabNavigatorCreateProps {
  routeNames: string[];
  preloadedRouteKeys: string[];
  popNestedStackToTop: (routeKey: string) => void;
}

export type BottomTabNavigatorContentProps = BottomTabNavigationConfig &
  BottomTabNavigatorCreateProps;

type ContentArgs = NavigatorContentProps<
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap,
  BottomTabNavigationConfig,
  BottomTabNavigatorCreateProps
>;

function BottomTabNavigatorContent({
  state,
  descriptors,
  actions,
  emitter,
  routeNames,
  preloadedRouteKeys,
  popNestedStackToTop,
  ...rest
}: ContentArgs) {
  const { visibleRoutes, focusedIndex } = useVisibleTabsWithRedirect({
    routes: state.routes,
    routeNames,
    focusedRouteKey: state.routes[state.index]!.key,
    descriptors,
  });
  const navigateToTab = (routeKey: string) => {
    const route = state.routes.find((route) => route.key === routeKey);
    if (route) {
      actions.navigate(route.name, route.params);
    } else if (__DEV__) {
      console.warn(
        `Bottom tabs could not switch to the tab "${routeKey}" because no tab with that key exists. ` +
          `'navigateToTab' takes a route key, not a route name — pass 'route.key' from the tab bar props.`
      );
    }
  };

  if (visibleRoutes.length === 0) {
    return null;
  }

  return (
    <BottomTabView
      {...rest}
      state={{
        // Only routes are substituted; navigator metadata remains from the real state.
        ...state,
        routes: visibleRoutes,
        index: focusedIndex,
      }}
      // TODO(@ubax): SDK-58: Try to remove the casting from here to ensure type safety
      // Integration supplies full descriptors, including preload placeholders; standard types omit route/navigation.
      descriptors={descriptors as unknown as BottomTabDescriptorMap}
      emitter={emitter}
      navigateToTab={navigateToTab}
      preloadedRouteKeys={preloadedRouteKeys}
      popNestedStackToTop={popNestedStackToTop}
    />
  );
}

export const createStandardBottomTabNavigator = createStandardNavigator<
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap,
  BottomTabNavigatorContentProps
>(BottomTabNavigatorContent);
