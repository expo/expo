'use client';
import { createContext, use, useMemo } from 'react';

/**
 * A parent-linked node describing a navigator that owns the current screen. Each node carries the
 * navigator kind (`type`, e.g. `'stack'`, `'tab'`, `'drawer'`), its navigation state `key`, and a
 * link to the parent navigator's node. Navigation state no longer carries a `type`, so navigator
 * kind lives only here, in React.
 *
 * Consumers use it two ways:
 *  - nearest-kind lookups read `type` on the value (e.g. "is this a preloaded stack route?");
 *  - link-preview navigation walks `parent` to collect the state keys of the tab navigators that are
 *    React ancestors of the link, which the state-layer traversal needs to look through tabs.
 *
 * `undefined` outside any navigator that provides it.
 */
export type NavigatorTypeContextValue = {
  /** The navigator kind; `undefined` for navigators of unknown kind (e.g. a custom router). */
  type: string | undefined;
  stateKey: string;
  parent?: NavigatorTypeContextValue;
};

export const NavigatorTypeContext = createContext<NavigatorTypeContextValue | undefined>(undefined);

/**
 * Builds the memoized context value for a navigator provider, linking it to the parent navigator.
 * Pass `type: undefined` for navigators of unknown kind (e.g. a custom router): the node still hides
 * the ancestor's kind from nearest-kind reads (which would otherwise pair the ancestor's kind with
 * the custom navigator's state), while keeping the parent chain walkable.
 */
export function useNavigatorTypeContextValue(
  type: string | undefined,
  stateKey: string
): NavigatorTypeContextValue {
  const parent = use(NavigatorTypeContext);
  return useMemo(() => ({ type, stateKey, parent }), [type, stateKey, parent]);
}

/** Walk the navigator chain (nearest first) collecting the state keys of the tab navigators. */
export function collectTabNavigatorKeys(node: NavigatorTypeContextValue | undefined): Set<string> {
  const keys = new Set<string>();
  while (node) {
    if (node.type === 'tab') {
      keys.add(node.stateKey);
    }
    node = node.parent;
  }
  return keys;
}
