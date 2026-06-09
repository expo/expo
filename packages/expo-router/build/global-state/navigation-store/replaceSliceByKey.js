"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceSliceByKey = replaceSliceByKey;
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
function replaceSliceByKey(tree, targetKey, slice) {
    // No tree yet (root not initialized) — nothing to address.
    if (!tree) {
        return tree;
    }
    // `done` short-circuits the recursion after the single match so we don't keep rebuilding
    // sibling branches (and can never install `slice` at a second colliding key).
    let done = false;
    const replaceNode = (node) => {
        if (node.key === targetKey) {
            done = true;
            return slice;
        }
        const nextRoutes = replaceInRoutes(node.routes);
        const nextPreloaded = !done && node.preloadedRoutes ? replaceInRoutes(node.preloadedRoutes) : node.preloadedRoutes;
        if (nextRoutes === node.routes && nextPreloaded === node.preloadedRoutes) {
            return node;
        }
        const next = { ...node, routes: nextRoutes };
        if (node.preloadedRoutes) {
            next.preloadedRoutes = nextPreloaded;
        }
        return next;
    };
    const replaceInRoutes = (routes) => {
        let changed = false;
        const next = routes.map((route) => {
            if (done || !route.state) {
                return route;
            }
            const nextState = replaceNode(route.state);
            if (nextState === route.state) {
                return route;
            }
            changed = true;
            return { ...route, state: nextState };
        });
        return changed ? next : routes;
    };
    return replaceNode(tree);
}
//# sourceMappingURL=replaceSliceByKey.js.map