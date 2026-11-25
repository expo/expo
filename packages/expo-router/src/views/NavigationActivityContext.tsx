'use client';

import { createContext, use, type ReactNode } from 'react';

const ActivityThresholdContext = createContext<number | undefined>(undefined);
// `undefined` when no ancestor navigator can hide the route.
export const AncestorHiddenContext = createContext<boolean | undefined>(undefined);

export function NavigationActivityProvider({
  activityThreshold,
  activityDisabled,
  children,
}: {
  activityThreshold: number | undefined;
  activityDisabled: boolean;
  children: ReactNode;
}) {
  const ancestorHidden = use(AncestorHiddenContext);

  return (
    <AncestorHiddenContext value={activityDisabled ? undefined : ancestorHidden}>
      <ActivityThresholdContext value={activityThreshold}>{children}</ActivityThresholdContext>
    </AncestorHiddenContext>
  );
}

export function useActivityThreshold() {
  return use(ActivityThresholdContext);
}
