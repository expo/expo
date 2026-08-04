'use client';
// TODO: Rename this file to `createStandardMaterialTopTabNavigator.tsx` in a follow-up.
import { createStandardNavigator } from 'standard-navigation';

import type { NavigatorContentProps } from '../../../standard-navigation/types';
import type {
  MaterialTopTabDescriptorMap,
  MaterialTopTabNavigationConfig,
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '../types';
import { MaterialTopTabView } from '../views/MaterialTopTabView';

export interface MaterialTopTabNavigatorCreateProps {
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
  preloadedRouteKeys,
  ...rest
}: ContentArgs) {
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

  return (
    <MaterialTopTabView
      {...rest}
      state={state}
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
