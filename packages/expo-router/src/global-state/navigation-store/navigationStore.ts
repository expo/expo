import { commitSlices, replaceRoot, type NavAction } from './navReducer';
import { replaceSliceByKey } from './replaceSliceByKey';
import type { NavigationSlice, NavigationTree, SliceCommit } from './types';
import { deepFreeze } from '../../react-navigation/core/deepFreeze';

type Dispatch = (action: NavAction) => void;

/**
 * The producer-side staging buffer that sits between react-navigation's (unchanged) synchronous
 * `getState`/`setState` cascade and React's render cycle.
 *
 * Why this exists: react-navigation's focus cascade is synchronous and reads-its-own-writes — each
 * ancestor's `getStateForRouteFocus` calls `getState()` and must observe the previous step's write.
 * A plain `useReducer` `dispatch` only applies on commit, which would feed the cascade stale state.
 * So we keep a synchronous `liveTreeRef`: every `setState` writes it immediately (the cascade reads
 * it back), and a single `flush()` publishes the fully-cascaded tree into React with one dispatch.
 * This is react-navigation's `useSyncState.batchUpdates` re-expressed for `useReducer` — including
 * its dev-only `deepFreeze` mutation guard, which we preserve so accidental state mutation is still
 * caught after the cascade's old freeze point (`useSyncState`) is removed.
 *
 * Flush boundary (review GO-condition): the consumer must call {@link NavigationStore.flush} on a
 * synchronous boundary — the imperative drain effect, or the render-phase layout effect — never a
 * deferred microtask, or code reading navigation state synchronously after `router.push()` would
 * observe a pre-flush tree.
 */
export interface NavigationStore {
  /** Read the live (synchronous, read-your-writes) tree. The cascade and `getState()` read this. */
  getState(): NavigationTree;
  /**
   * Imperative path: stage a fully-rebuilt root tree (last write wins until flushed).
   *
   * Precondition: `tree` must be derived from the current {@link getState} result, because a staged
   * root supersedes any slices staged in the same flush window (see {@link flush}). Callers must not
   * stage a root built from a snapshot taken before a `commitSlice` in the same task.
   */
  stageRootState(tree: NavigationTree): void;
  /** Render-phase path: compose one navigator's slice into the live tree, addressed by key. */
  commitSlice(key: string, slice: NavigationSlice): void;
  /** Publish staged changes into React with a single dispatch. No-op when nothing is pending. */
  flush(): void;
  /** Wire the live `useReducer` dispatch. Until set, flushes buffer (used before the root mounts). */
  setDispatch(dispatch: Dispatch | null): void;
}

export function createNavigationStore(initialTree: NavigationTree): NavigationStore {
  const liveTreeRef = { current: deepFreeze(initialTree) as NavigationTree };
  let dispatch: Dispatch | null = null;

  // Pending work for the next flush. `pendingRoot` (imperative) takes precedence over
  // `pendingSlices` (render-phase) because a staged root tree already subsumes any slice writes.
  let pendingRoot: NavigationTree | null = null;
  let pendingSlices: SliceCommit[] = [];
  let isFlushing = false;

  return {
    getState() {
      return liveTreeRef.current;
    },
    stageRootState(tree) {
      if (process.env.NODE_ENV !== 'production' && pendingSlices.length > 0) {
        console.warn(
          `[expo-router] A staged root navigation state superseded ${pendingSlices.length} ` +
            `pending slice commit(s) in the same flush window. The root must be derived from the ` +
            `latest getState() so those writes are not lost.`
        );
      }
      liveTreeRef.current = deepFreeze(tree) as NavigationTree;
      pendingRoot = tree;
    },
    commitSlice(key, slice) {
      // Update the live tree synchronously so a sibling committing later in the same task reads it.
      const next = replaceSliceByKey(
        liveTreeRef.current,
        key,
        deepFreeze(slice) as NavigationSlice
      );
      if (next === liveTreeRef.current) {
        // Unknown key (e.g. a not-yet-mounted lazy navigator) — nothing changed, nothing to commit.
        return;
      }
      liveTreeRef.current = next;
      pendingSlices.push({ key, slice });
    },
    flush() {
      if (isFlushing) {
        // A dispatched render that synchronously stages + flushes again must not re-enter mid-flush.
        return;
      }
      const root = pendingRoot;
      const slices = pendingSlices;
      pendingRoot = null;
      pendingSlices = [];

      if (!dispatch) {
        // No reducer wired yet (pre-mount) or after unmount. The live tree already holds the result
        // and seeds the reducer when the provider mounts, so dropping the dispatch is safe.
        return;
      }
      if (root === null && slices.length === 0) {
        return;
      }

      isFlushing = true;
      try {
        if (root !== null) {
          dispatch(replaceRoot(root));
        } else {
          dispatch(commitSlices(slices));
        }
      } finally {
        isFlushing = false;
      }
    },
    setDispatch(next) {
      dispatch = next;
    },
  };
}
