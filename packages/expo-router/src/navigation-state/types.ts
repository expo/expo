// Core types for the Router v57 global state model (RFC.md, Decisions.md).
//
// Nodes are HOMOGENEOUS — no `type: 'stack' | 'tabs'`. How a node renders, and what an action means
// against it, is decided by the navigator's ROUTER (declared at render, Decisions R-13), not stored
// on the node (RFC D5).

/** A single navigator level: a list of routes and the focused one. */
export type NavNode = {
  /** Unique across the ENTIRE tree — the reducer and the router registry address nodes by key. */
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

/** Where an update came from. The reducer ignores it; it rides along for the render layer (P-6). */
export type ActionSource = 'js' | 'native';

/** The route an action targets at one navigator level. `child` is the hydrated subtree to graft when
 * the route is being promoted/pushed; `key` is reused when present, else the router mints one (P-7). */
export type TargetRoute = { key?: string; name: string; params?: object; child?: NavNode };

/** The RFC action set (RFC "Actions"). A router maps these to a next local state. `preload` is
 * navigator-local (D6) and resolves to `null` — it never reaches the reducer. */
export type NavAction =
  | { type: 'navigate'; target: TargetRoute }
  | { type: 'goBack' }
  | { type: 'goBackTo'; routeKey: string }
  | { type: 'replace'; target: TargetRoute }
  | { type: 'reset'; state: NavNode }
  | { type: 'preload'; target: TargetRoute };

/** A navigator's router: the single function that computes this level's next subtree from an action,
 * or `null` if it doesn't handle the action (so back can bubble). Pure and render-free (Decisions R-13). */
export type NavRouter = {
  getStateForAction: (node: NavNode, action: NavAction) => NavNode | null;
};
