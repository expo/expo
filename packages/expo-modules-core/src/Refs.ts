import { createRef, type RefObject } from 'react';

/**
 * Create a React ref object that is friendly for snapshots.
 * It will be represented as `[React.ref]` in snapshots.
 * @returns A React ref object.
 */
export function createSnapshotFriendlyRef<T>(): RefObject<T | null> {
  return createRef<T>();
}
