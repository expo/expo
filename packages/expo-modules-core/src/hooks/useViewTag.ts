'use client';

import { useState, useLayoutEffect, type RefObject } from 'react';
import { findNodeHandle } from 'react-native';

/**
 * Returns the native view tag for a component ref, suitable for passing
 * into worklet closures (since it's a plain number, not an object).
 */
export function useViewTag(ref: RefObject<any>): number | null {
  const [viewTag, setViewTag] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      setViewTag(findNodeHandle(ref.current));
    }
  }, []);

  return viewTag;
}
