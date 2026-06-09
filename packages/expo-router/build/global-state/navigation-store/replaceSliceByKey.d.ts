import type { NavigationSlice, NavigationTree } from './types';
/**
 * Immutably replace the navigator state whose `key` matches `targetKey` with `slice`, anywhere in
 * the nested tree, while preserving referential identity of every untouched branch (structural
 * sharing). Untouched branches keeping their identity is what lets `React.memo`'d navigators bail
 * out of re-rendering on an unrelated navigation.
 *
 * Navigation-state keys are globally unique (`stack-${nanoid()}` / `tab-${nanoid()}`), so there is
 * exactly one match; the walk short-circuits on the first one — it never aliases `slice` into two
 * positions and never traverses branches past the match.
 *
 * Returns the original `tree` reference unchanged when `targetKey` is not found, so a no-op commit
 * never invalidates memoization.
 *
 * Both `routes[].state` and (for stacks) `preloadedRoutes[].state` are searched so that nested
 * navigators rendered behind a preloaded screen are still addressable; the `preloadedRoutes` array
 * keeps its identity when nothing inside it changed (the iOS link-preview workaround in
 * `StackClient` relies on preloaded route entries staying referentially stable).
 */
export declare function replaceSliceByKey(tree: NavigationTree, targetKey: string, slice: NavigationSlice): NavigationTree;
//# sourceMappingURL=replaceSliceByKey.d.ts.map