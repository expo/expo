import * as React from 'react';

import { NavigationBuilderContext } from './NavigationBuilderContext';
import { useClientLayoutEffect } from './useClientLayoutEffect';

/**
 * When screen config changes, we want to update the navigator in the same update phase.
 * However, navigation state is in the root component and React won't let us update it from a child.
 * This is a workaround for that, the scheduled update is stored in the ref without actually calling setState.
 * It lets all subsequent updates access the latest state so it stays correct.
 * Then we call setState during after the component updates.
 */
export function useScheduleUpdate(callback: () => void) {
  const { scheduleUpdate, flushUpdates } = React.useContext(
    NavigationBuilderContext
  );

  // FIXME: This is potentially unsafe
  // However, since we are using sync store, it might be fine
  scheduleUpdate(callback);

  useClientLayoutEffect(flushUpdates);
}
