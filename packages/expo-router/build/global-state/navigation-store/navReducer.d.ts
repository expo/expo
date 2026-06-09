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
export type NavAction = {
    type: 'SEED';
    tree: NavigationTree;
} | {
    type: 'REPLACE_ROOT';
    tree: NavigationTree;
} | {
    type: 'COMMIT_SLICES';
    slices: SliceCommit[];
} | {
    type: 'RESET';
    tree: NavigationTree;
};
export declare const seed: (tree: NavigationTree) => NavAction;
export declare const replaceRoot: (tree: NavigationTree) => NavAction;
export declare const commitSlices: (slices: SliceCommit[]) => NavAction;
export declare const reset: (tree: NavigationTree) => NavAction;
export declare function navReducer(tree: NavigationTree, action: NavAction): NavigationTree;
//# sourceMappingURL=navReducer.d.ts.map