'use client';

import { createContext, use, type ReactNode } from 'react';

import type { NavigationState, Route } from '../react-navigation/native';

const ScreensAboveContext = createContext(0);
const ActivityThresholdContext = createContext<number | false | undefined>(undefined);

export function NavigationActivityProvider({
  activityEnabled,
  state,
  route,
  children,
}: {
  activityEnabled: boolean | number | undefined;
  state: NavigationState;
  route: Route<string>;
  children: ReactNode;
}) {
  const inheritedScreensAbove = use(ScreensAboveContext);
  const inheritedThreshold = use(ActivityThresholdContext);
  const ownIndex = state.routes.findIndex(({ key }) => key === route.key);
  const screensAbove =
    ownIndex < 0
      ? 0
      : state.type === 'stack'
        ? Math.max(0, state.index - ownIndex)
        : state.routes[state.index]?.key === route.key
          ? 0
          : 1;
  const threshold =
    activityEnabled === undefined
      ? inheritedThreshold
      : activityEnabled === false
        ? false
        : typeof activityEnabled === 'number'
          ? Math.max(1, activityEnabled)
          : state.type === 'stack'
            ? 2
            : 1;

  return (
    <ActivityThresholdContext value={threshold}>
      <ScreensAboveContext value={inheritedScreensAbove + screensAbove}>
        {children}
      </ScreensAboveContext>
    </ActivityThresholdContext>
  );
}

export function useScreensAbove() {
  return use(ScreensAboveContext);
}

export function useActivityThreshold() {
  return use(ActivityThresholdContext);
}
