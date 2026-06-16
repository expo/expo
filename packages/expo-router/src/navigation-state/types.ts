// Core types for the Router v57 global state model (RFC.md, Decisions.md).
//
// Nodes are HOMOGENEOUS — no `type: 'stack' | 'tabs'`. How a node renders, and what an action means
// against it, is decided by a behavior chosen by node name (Decisions P-2/P-4), not stored on the
// node (RFC D5).

/** A single navigator level: a list of routes and the focused one. */
export type NavNode = {
  /** Unique across the ENTIRE tree — ops address nodes by key (Decisions P-7, architecture review). */
  key: string;
  routes: RouteEntry[];
  /** The focused route. For multi-visible renderers (split view) it is the focused column; the
   * renderer may show several routes at once (Decisions P-10). */
  index: number;
};

/** One route within a node. May host a nested navigator via `child`. */
export type RouteEntry = {
  key: string;
  name: string;
  params?: object;
  child?: NavNode;
};

/** The whole-app tree. A URL hydrates only the minimal active path (RFC D1). */
export type GlobalNavState = { root: NavNode };

/** Where an update came from. The reducer ignores it; it rides along for the render layer (P-6).
 * `'hydration' | 'seed'` are added in Phase 2 when a seeding path produces them. */
export type ActionSource = 'js' | 'native';

/** The dumb reducer's vocabulary. Every op names its node by `target` (a node key). Ops are pure
 * and `remove` is idempotent — removing an absent route key is identity (Decisions P-3/P-7). */
export type PrimitiveOp =
  | { type: 'insert'; target: string; route: RouteEntry }
  | { type: 'remove'; target: string; routeKeys: string[] }
  | { type: 'setIndex'; target: string; index: number };

/** A node-local intent — what was asked of ONE node. The behavior maps it to primitive ops.
 * Path/scope resolution (which node an intent targets) is Phase 3. */
export type NodeIntent =
  | { type: 'push'; route: RouteEntry }
  | { type: 'goBack' }
  | { type: 'popTo'; routeKey: string }
  | { type: 'popToTop' }
  /** Focus a route by name; promote (insert) or pop-to it if needed — the unmounted-branch case (P-5). */
  | { type: 'focus'; route: RouteEntry };

/** The two behaviors that ship this session. New behaviors extend the `switch`, not the node shape. */
export type BehaviorName = 'stack' | 'tabs';

/** Static `node name → behavior` map — the stand-in for RFC D8's merged manifest (Decisions P-4). */
export type BehaviorLookup = Record<string, BehaviorName>;

/** A behavior decides what an intent means against a node. (`canHandleBack` for bubbled back arrives
 * in Phase 3 with the cross-tree `resolveBack` that consumes it — Decisions P-8.) */
export type BehaviorStrategy = {
  resolve: (intent: NodeIntent, node: NavNode) => PrimitiveOp[];
};
