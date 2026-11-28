'use client';
// TODO: Rename this file to `createStandardBottomTabNavigator.tsx` in a follow-up.
import { type ReactNode, useMemo } from 'react';
import { createStandardNavigator } from 'standard-navigation';

import type { NavigatorContentProps } from '../../../standard-navigation/types';
import { useNonStackAnchorWarning } from '../../../standard-navigation/useNonStackAnchorWarning';
import { usePreloadPlaceholderRoutes } from '../../../standard-navigation/usePreloadPlaceholderRoutes';
import { useReconcileTabHistory } from '../../../standard-navigation/useReconcileTabHistory';
import { useVisibleTabsWithRedirect } from '../../../standard-navigation/useVisibleTabsWithRedirect';
import useLatestCallback from '../../../utils/useLatestCallback';
import type { TabRouterOptions } from '../../native';
import type {
  BottomTabDescriptorMap,
  BottomTabNavigationConfig,
  BottomTabNavigationEventMap,
  BottomTabNavigationOptions,
} from '../types';
import { BottomTabView } from '../views/BottomTabView';

export interface BottomTabNavigatorCreateProps {
  isPreloaded: (key: string) => boolean;
  isRemovalPrevented: (key: string) => boolean;
  routeNames: string[];
  popNestedStackToTop: (routeKey: string) => void;
  preload: (name: string) => void;
}

export type BottomTabNavigatorContentProps = BottomTabNavigationConfig &
  BottomTabNavigatorCreateProps;

type ContentArgs = NavigatorContentProps<
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap,
  // Router options are forwarded to the content too.
  BottomTabNavigationConfig & Pick<TabRouterOptions, 'backBehavior'>,
  BottomTabNavigatorCreateProps
>;

// `useReconcileTabHistory` reads the root navigation state, so its caller renders on every
// navigation. Keep it in a component that renders nothing, so the navigator content does not.
function ReconcileTabHistory() {
  useReconcileTabHistory();
  return null;
}

function BottomTabNavigatorContent({
  state,
  descriptors,
  actions,
  emitter,
  isPreloaded: _isPreloaded,
  isRemovalPrevented: _isRemovalPrevented,
  routeNames,
  popNestedStackToTop,
  preload,
  backBehavior,
  ...rest
}: ContentArgs) {
  useNonStackAnchorWarning(backBehavior);
  const { visibleRoutes, focusedIndex, focusedFallbackRoute } = useVisibleTabsWithRedirect({
    routes: state.routes,
    routeNames,
    focusedRouteKey: state.routes[state.index]?.key,
    descriptors,
  });
  // TODO(@ubax): SDK-58: Try to remove the casting from here to ensure type safety
  // Integration supplies full descriptors, including preload placeholders; standard types omit route/navigation.
  const bottomTabDescriptors = descriptors as unknown as BottomTabDescriptorMap;
  const navigateToTab = useLatestCallback((routeKey: string) => {
    const route = state.routes.find((route) => route.key === routeKey);
    if (route) {
      actions.navigate(route.name, route.params);
    } else if (__DEV__) {
      console.warn(
        `Bottom tabs could not switch to the tab "${routeKey}" because no tab with that key exists. ` +
          `'navigateToTab' takes a route key, not a route name — pass 'route.key' from the tab bar props.`
      );
    }
  });
  // Only routes are substituted; navigator metadata remains from the real state.
  const visibleState = useMemo(
    () => ({ ...state, routes: visibleRoutes, index: focusedIndex }),
    [state, visibleRoutes, focusedIndex]
  );

  usePreloadPlaceholderRoutes({
    routes: visibleRoutes,
    descriptors: bottomTabDescriptors,
    preload,
    lazyByDefault: true,
  });

  let content: ReactNode;

  if (focusedFallbackRoute) {
    content = descriptors[focusedFallbackRoute.key]?.render() ?? null;
  } else if (visibleRoutes.length === 0 || focusedIndex < 0) {
    content = null;
  } else {
    content = (
      <BottomTabView
        {...rest}
        state={visibleState}
        descriptors={bottomTabDescriptors}
        emitter={emitter}
        navigateToTab={navigateToTab}
        popNestedStackToTop={popNestedStackToTop}
      />
    );
  }

  return (
    <>
      <ReconcileTabHistory />
      {content}
    </>
  );
}

export const createStandardBottomTabNavigator = createStandardNavigator<
  BottomTabNavigationOptions,
  BottomTabNavigationEventMap,
  BottomTabNavigatorContentProps
>(BottomTabNavigatorContent);
