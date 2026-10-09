'use client';

import { createContext, use, type ReactNode } from 'react';

const ActivityThresholdContext = createContext<number | undefined>(undefined);

export function NavigationActivityProvider({
  activityThreshold,
  children,
}: {
  activityThreshold: number | undefined;
  children: ReactNode;
}) {
  return <ActivityThresholdContext value={activityThreshold}>{children}</ActivityThresholdContext>;
}

export function useActivityThreshold() {
  return use(ActivityThresholdContext);
}
