'use client';

import type { DependencyList } from 'react';

import type { SharedObject } from '../ts-declarations/SharedObject';
import { useReleasingSharedObjectWithLifecycle } from './useReleasingSharedObjectWithLifecycle';

/**
 * Returns a shared object, which is automatically cleaned up when the component is unmounted.
 *
 * > **important** Due to React component lifecycle limitations, when a component is unmounted while inside a hidden React
 * > [`Activity`](https://react.dev/reference/react/Activity), its shared object stays alive until
 * > its JavaScript object is garbage-collected.
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
