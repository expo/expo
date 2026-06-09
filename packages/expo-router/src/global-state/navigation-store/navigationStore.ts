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

export function createNavigationStore(initialTree: NavigationTree): NavigationStore {
  const liveTreeRef = { current: deepFreeze(initialTree) as NavigationTree };
  let dispatch: Dispatch | null = null;

  // Pending work for the next flush. `pendingRoot` (imperative) takes precedence over
  // `pendingSlices` (render-phase) because a staged root tree already subsumes any slice writes.
  let pendingRoot: NavigationTree | null = null;
  let pendingSlices: SliceCommit[] = [];
  let isBatching = false;
  let isFlushing = false;

  const flush = () => {
    if (isFlushing) {
      // A dispatched render that synchronously stages + flushes again must not re-enter mid-flush.
      return;
    }
    if (!dispatch) {
      // No reducer wired yet (pre-mount) or after unmount. Keep the pending work buffered — the live
      // tree already holds the result and seeds the reducer on mount; a later flush (once a dispatch
      // is wired) still publishes it, so it is not silently dropped.
      return;
    }
    const root = pendingRoot;
    const slices = pendingSlices;
    if (root === null && slices.length === 0) {
      return;
    }
    pendingRoot = null;
    pendingSlices = [];

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
  };

  return {
    getState() {
      return liveTreeRef.current;
    },
    stageRootState(tree) {
      if (process.env.NODE_ENV !== 'production' && pendingSlices.length > 0) {
        console.warn(
          `[expo-router] A staged root navigation state superseded ${pendingSlices.length} ` +
            `pending slice commit(s). The root must be derived from the latest getState() so those ` +
            `writes are not lost.`
        );
      }
      liveTreeRef.current = deepFreeze(tree) as NavigationTree;
      pendingRoot = tree;
      pendingSlices = [];
      if (!isBatching) {
        flush();
      }
    },
    commitSlice(key, slice) {
      // Update the live tree synchronously so a sibling committing later in the same batch reads it.
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
      if (!isBatching) {
        flush();
      }
    },
    batch(callback) {
      const wasBatching = isBatching;
      isBatching = true;
      try {
        callback();
      } finally {
        isBatching = wasBatching;
      }
      if (!isBatching) {
        flush();
      }
    },
    flush,
    setDispatch(next) {
      dispatch = next;
    },
  };
}

// The root store is a module singleton (matching `routingQueue` / `store`) so the imperative drain
// effect — which lives above the navigation container and cannot read its context — can batch and
// flush through it. Reset on each container mount.
let rootStore: NavigationStore | null = null;

export function setRootNavigationStore(store: NavigationStore | null) {
  rootStore = store;
}

export function getRootNavigationStore(): NavigationStore | null {
  return rootStore;
}
