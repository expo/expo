'use client';

import { useEffect } from 'react';

import type { BrowserHistoryAdapter } from './browserHistory.types';
import { useEnqueueRoutingIntent } from './routingQueueContext';

// Browser back, forward and hash links enter the navigation reducer like any other intent.
export function BrowserHistorySync({ adapter }: { adapter: BrowserHistoryAdapter }) {
  const enqueue = useEnqueueRoutingIntent();

  useEffect(
    () =>
      adapter.listen((change) => {
        enqueue({ type: 'BROWSER_HISTORY_CHANGED', payload: change });
      }),
    [adapter, enqueue]
  );

  return null;
}
