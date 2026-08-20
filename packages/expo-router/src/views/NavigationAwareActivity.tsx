'use client';
import type { ReactNode } from 'react';

import { useRouteNode } from '../Route';
import { useIsFocused, useNavigationState, useRoute } from '../react-navigation/native';
import { ActivityContents } from './ActivityContents';

export type ActivityMode = 'visible' | 'hidden';

/**
 * @internal
 */
export function useActivityMode(hideWhenNestedAtLevel = 2): ActivityMode {
  const route = useRoute();
  const isFocused = useIsFocused();
  const screensAbove = useNavigationState((state) => {
    if (state.type !== 'stack') {
      return 0;
    }

    const ownIndex = state.routes.findIndex(({ key }) => key === route.key);
    return ownIndex < 0 ? 0 : Math.max(0, state.index - ownIndex);
  });

  return hideWhenNestedAtLevel <= 1
    ? isFocused
      ? 'visible'
      : 'hidden'
    : screensAbove >= hideWhenNestedAtLevel
      ? 'hidden'
      : 'visible';
}

export function NavigationAwareActivity({
  hideWhenNestedAtLevel = 2,
  children,
}: {
  hideWhenNestedAtLevel?: number;
  children: ReactNode;
}) {
  const routeNode = useRouteNode();

  if (routeNode?.type !== 'route') {
    throw new Error('NavigationAwareActivity must be rendered inside a screen component.');
  }

  return (
    <NavigationAwareScreenActivity hideWhenNestedAtLevel={hideWhenNestedAtLevel}>
      {children}
    </NavigationAwareScreenActivity>
  );
}

function NavigationAwareScreenActivity({
  hideWhenNestedAtLevel,
  children,
}: {
  hideWhenNestedAtLevel: number;
  children: ReactNode;
}) {
  const mode = useActivityMode(hideWhenNestedAtLevel);

  return <ActivityContents mode={mode}>{children}</ActivityContents>;
}
