'use client';

import { use, useMemo } from 'react';

import { ReadCanDismissContext } from '../react-navigation/core/CanDismissContext';
import { createImperativeRouter } from './router';
import { useEnqueueRoutingIntent, useSetRoutingTransitionMode } from './routingQueueContext';

export function useRouterActions(): ReturnType<typeof createImperativeRouter> {
  const enqueue = useEnqueueRoutingIntent();
  const setTransitionMode = useSetRoutingTransitionMode();
  const canDismiss = use(ReadCanDismissContext);
  return useMemo(
    () => createImperativeRouter(enqueue, setTransitionMode, canDismiss),
    [enqueue, setTransitionMode, canDismiss]
  );
}
