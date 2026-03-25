'use client';
import { use } from 'react';

import { GestureHandlerRefContext } from './GestureHandlerRefContext';

export function useGestureHandlerRef() {
  const ref = use(GestureHandlerRefContext);

  if (ref === undefined) {
    throw new Error("Couldn't find a ref for gesture handler. Are you inside a screen in Stack?");
  }

  return ref;
}
