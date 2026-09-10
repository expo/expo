'use client';

import { createContext, use, type ReactNode } from 'react';

import type { NavigationState, Route } from '../react-navigation/native';

const ScreensAboveContext = createContext(0);
const ActivityThresholdContext = createContext<number | undefined>(undefined);

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
  const screensAbove = getScreensAbove(state, route);
  const threshold =
    typeof activityEnabled === 'number'
      ? Math.max(1, activityEnabled)
      : activityEnabled
        ? state.type === 'stack'
          ? 2
          : 1
        : undefined;

  return (
    <ActivityThresholdContext value={threshold}>
      <ScreensAboveContext value={inheritedScreensAbove + screensAbove}>
        {children}
      </ScreensAboveContext>
    </ActivityThresholdContext>
  );
}

function getScreensAbove(state: NavigationState, route: Route<string>) {
  const ownIndex = state.routes.findIndex(({ key }) => key === route.key);
  if (ownIndex < 0) {
    return 0;
  }
  if (state.type === 'stack') {
    return Math.max(0, state.index - ownIndex);
  }
  return state.routes[state.index]?.key === route.key ? 0 : 1;
}

export function useScreensAbove() {
  return use(ScreensAboveContext);
}

export function useActivityThreshold() {
  return use(ActivityThresholdContext);
}
