import { type NavAction } from './navReducer';
import type { NavigationSlice, NavigationTree } from './types';
type Dispatch = (action: NavAction) => void;
/**
 * The producer-side staging buffer that sits between react-navigation's (unchanged) synchronous
 * `getState`/`setState` cascade and React's render cycle.
 *
 * Why this exists: react-navigation's focus cascade is synchronous and reads-its-own-writes — each
 * ancestor's `getStateForRouteFocus` calls `getState()` and must observe the previous step's write.
 * A plain `useReducer` `dispatch` only applies on commit, which would feed the cascade stale state.
 * So we keep a synchronous `liveTreeRef`: every `setState` writes it immediately (the cascade reads
 * it back), then publishes the result into React via a reducer dispatch.
 *
 * This mirrors react-navigation's old `useSyncState` exactly: a write notifies (here: dispatches)
 * immediately unless we are inside a {@link NavigationStore.batch}, which suppresses the dispatch
 * until the batch ends so a multi-step cascade collapses into a single `REPLACE_ROOT` — one logical
 * navigation, one render, one native diff. It also preserves the dev-only `deepFreeze` mutation
 * guard that `useSyncState` provided (the old freeze point is removed with it).
 *
 * Flush boundary: a write/batch dispatches synchronously, never on a deferred microtask, so code
 * reading navigation state synchronously after `router.push()` never observes a pre-flush tree.
 */
export interface NavigationStore {
    /** Read the live (synchronous, read-your-writes) tree. The cascade and `getState()` read this. */
    getState(): NavigationTree;
    /** Imperative path: stage a fully-rebuilt root tree. Dispatches now unless inside a batch. */
    stageRootState(tree: NavigationTree): void;
    /** Render-phase path: compose one navigator's slice into the live tree, addressed by key. */
    commitSlice(key: string, slice: NavigationSlice): void;
    /** Run `callback` with dispatch suppressed, then publish the accumulated result in one dispatch. */
    batch(callback: () => void): void;
    /** Publish staged changes into React with a single dispatch. No-op when nothing is pending. */
    flush(): void;
    /** Wire the live `useReducer` dispatch. Until set, writes buffer (used before the root mounts). */
    setDispatch(dispatch: Dispatch | null): void;
}
export declare function createNavigationStore(initialTree: NavigationTree): NavigationStore;
export declare function setRootNavigationStore(store: NavigationStore | null): void;
export declare function getRootNavigationStore(): NavigationStore | null;
export {};
//# sourceMappingURL=navigationStore.d.ts.map