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

/**
 * Wraps the screen contents in a React `Activity` that hides once the screen is buried deep enough
 * in the stack. Hiding runs effect cleanups and releases resources, but keeps React state, so the
 * screen looks unchanged when the user navigates back to it.
 *
 * Must be rendered inside a screen component.
 *
 * @param hideWhenNestedAtLevel How many screens must sit above this one before it hides. `1` hides
 * the screen as soon as it loses focus, which also works in tabs and drawers. Defaults to `2`.
 *
 * > **Note:** This API is unstable and may change or be removed in any release.
 */
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
