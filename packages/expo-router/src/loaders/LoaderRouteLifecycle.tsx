import { use, useEffect } from 'react';

import { LoaderContext, type LoaderContextValue } from './LoaderContext';
import { scheduleAbandonLoaderPath } from './abandonLoaderPath';

interface ScheduledAbandonment {
  cancel: () => void;
}

// This coordinates only same-turn cleanup/setup handoffs. It does not retain route ownership.
const scheduledAbandonments = new Map<string, ScheduledAbandonment>();

function cancelScheduledAbandonment(path: string) {
  const scheduled = scheduledAbandonments.get(path);
  if (!scheduled) {
    return;
  }

  scheduled.cancel();
  scheduledAbandonments.delete(path);
}

function scheduleRouteAbandonment(ctx: LoaderContextValue, path: string) {
  cancelScheduledAbandonment(path);

  const scheduled = { cancel: scheduleAbandonLoaderPath(ctx, path) };
  scheduledAbandonments.set(path, scheduled);
  queueMicrotask(() => {
    if (scheduledAbandonments.get(path) === scheduled) {
      scheduledAbandonments.delete(path);
    }
  });
}

/** Adapts the committed route-shell lifecycle to the framework-neutral abandonment primitive. */
export function LoaderRouteLifecycle({ path }: { path: string }) {
  const ctx = use(LoaderContext);

  useEffect(() => {
    cancelScheduledAbandonment(path);
    return () => {
      scheduleRouteAbandonment(ctx, path);
    };
  }, [ctx, path]);

  return null;
}
