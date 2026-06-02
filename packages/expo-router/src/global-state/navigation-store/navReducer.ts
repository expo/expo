import { replaceSliceByKey } from './replaceSliceByKey';
import type { NavigationTree, SliceCommit } from './types';

/**
 * Actions accepted by {@link navReducer}.
 *
 * The reducer is intentionally *dumb*: it never runs a router, never bubbles an action, and holds
 * no router registry. All routing resolution stays in `useOnAction`/`useOnRouteFocus` (where the
 * live routers, config, `beforeRemove` listeners, and emitter already are). The reducer only
 * publishes already-resolved navigation state into React's render cycle.
 *
 * Two commit primitives:
 * - `REPLACE_ROOT` — the imperative-navigation path. The producer has already mutated the live
 *   staging tree synchronously (leaf write + every ancestor-focus write), so the buffered tree is
 *   complete and is published wholesale in a single dispatch per logical navigation.
 * - `COMMIT_SLICES` — the render-phase/bootstrap path. Several navigators may write their own slice
 *   in one React commit (initial mount, `getRehydratedState`, `getStateForRouteNamesChange`, lazy
 *   tab fill, Protected toggles); applying them by key in dispatch order composes those writes
 *   instead of letting a wholesale tree from one navigator clobber its siblings.
 */
export type NavAction =
  | { type: 'SEED'; tree: NavigationTree }
  | { type: 'REPLACE_ROOT'; tree: NavigationTree }
  | { type: 'COMMIT_SLICES'; slices: SliceCommit[] }
  | { type: 'RESET'; tree: NavigationTree };

export const seed = (tree: NavigationTree): NavAction => ({ type: 'SEED', tree });
export const replaceRoot = (tree: NavigationTree): NavAction => ({ type: 'REPLACE_ROOT', tree });
export const commitSlices = (slices: SliceCommit[]): NavAction => ({
  type: 'COMMIT_SLICES',
  slices,
});
export const reset = (tree: NavigationTree): NavAction => ({ type: 'RESET', tree });

export function navReducer(tree: NavigationTree, action: NavAction): NavigationTree {
  switch (action.type) {
    case 'SEED':
    case 'REPLACE_ROOT':
    case 'RESET':
      return action.tree;
    case 'COMMIT_SLICES':
      // Apply in dispatch order so a parent write and a child write in the same commit compose.
      // Unknown keys are no-ops (`replaceSliceByKey` returns the same reference), which also keeps
      // memoization intact for slices that were never seeded yet (lazy navigators).
      return action.slices.reduce(
        (current, { key, slice }) => replaceSliceByKey(current, key, slice),
        tree
      );
    default:
      return tree;
  }
}
