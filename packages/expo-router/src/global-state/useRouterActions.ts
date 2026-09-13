'use client';

import { useMemo } from 'react';

import { createImperativeRouter } from './router';
import { useEnqueueRoutingIntent } from './routingQueueContext';

export function useRouterActions(): ReturnType<typeof createImperativeRouter> {
  const enqueue = useEnqueueRoutingIntent();
  return useMemo(() => createImperativeRouter(enqueue), [enqueue]);
}
