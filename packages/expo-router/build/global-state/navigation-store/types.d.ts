import type { ReactNavigationState } from '../types';
/**
 * The whole nested navigation state held by the global store. It is the same shape
 * react-navigation already uses (`NavigationState | PartialState<NavigationState>`); the
 * difference is only *where* it lives — in a single root reducer instead of a tree of
 * per-navigator `useSyncState` stores.
 *
 * `undefined` is a valid value: before the top navigator runs `getInitialState`, the root tree is
 * undefined (mirroring react-navigation's `useSyncState<State | undefined>`).
 */
export type NavigationTree = ReactNavigationState | undefined;
/**
 * A single navigator's state, addressed by its navigation-state `key`. A "slice" is just a
 * subtree of {@link NavigationTree}; the global store never needs a router to *find* it — the
 * key is enough.
 */
export type NavigationSlice = ReactNavigationState;
/**
 * One render-phase commit: replace the navigator whose state `key` matches with `slice`.
 *
 * @see {@link commitSlices}
 */
export interface SliceCommit {
    key: string;
    slice: NavigationSlice;
}
//# sourceMappingURL=types.d.ts.map