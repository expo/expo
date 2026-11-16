'use client';

import { useMemo } from 'react';

import { createImperativeRouter } from './router';
import { useEnqueueRoutingIntent, useSetRoutingTransitionMode } from './routingQueueContext';

export function useRouterActions(): ReturnType<typeof createImperativeRouter> {
  const enqueue = useEnqueueRoutingIntent();
  const setTransitionMode = useSetRoutingTransitionMode();
  return useMemo(
    () => createImperativeRouter(enqueue, setTransitionMode),
    [enqueue, setTransitionMode]
  );
}
