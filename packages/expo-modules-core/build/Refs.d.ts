import { type RefObject } from 'react';
/**
 * Create a React ref object that is friendly for snapshots.
 * It will be represented as `[React.ref]` in snapshots.
 * @returns A React ref object.
 */
export declare function createSnapshotFriendlyRef<T>(): RefObject<T | null>;
//# sourceMappingURL=Refs.d.ts.map