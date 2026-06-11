'use client';

import type { DependencyList } from 'react';

import { useReleasingSharedObjectWithLifecycle } from './useReleasingSharedObjectWithLifecycle';
import type { SharedObject } from '../ts-declarations/SharedObject';

/**
 * Returns a shared object, which is automatically cleaned up when the component is unmounted.
 */
export function useReleasingSharedObject<TSharedObject extends SharedObject>(
  factory: () => TSharedObject,
  dependencies: DependencyList
): TSharedObject {
  return useReleasingSharedObjectWithLifecycle(
    {
      factory,
    },
    dependencies
  );
}
