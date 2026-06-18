// The partial react-navigation `navigation` for the reused native stack views (Decisions R-2/R-13).
//
// Reusing the existing views + `getQualifiedRouteComponent` needs a `navigation` object, but the
// consumed surface is small: `BaseRoute` calls `isFocused`/`getState`/`addListener`/`replaceParams`;
// the views dispatch `GO_BACK`/`POP`/`POP_TO_TOP`. Each write runs the stack router and commits the
// new local node via `dispatchNav` — RN's routers are never in the loop (C12). Cast at the boundary.

import type { EventEmitter } from './emitter';
import { projectToStackState } from './projectToStackState';
import type { ParamListBase } from '../../react-navigation/native';
import type { NativeStackNavigationProp } from '../../react-navigation/native-stack/types';
import type { NavCommit } from '../reducer';
import { stackRouter } from '../routers';
import type { NavAction, NavNode } from '../types';

export type ShimDeps = {
  /** The navigator node this screen belongs to (current render slice). */
  node: NavNode;
  /** Commit a node swap to the new store. */
  dispatch: (commit: NavCommit) => void;
  /** Per-navigator event bus (focus/transitionEnd/…). */
  emitter: EventEmitter;
};

export function createStackNavigationShim(
  routeKey: string,
  { node, dispatch, emitter }: ShimDeps
): NativeStackNavigationProp<ParamListBase> {
  const run = (action: NavAction, source: NavCommit['source'] = 'js') => {
    const next = stackRouter.getStateForAction(node, action);
    if (next) dispatch({ key: node.key, next, source });
  };

  /** Pop `count` routes (native `dismissCount` / `POP`) → go back to the route that depth. */
  const pop = (count: number, source: NavCommit['source']) => {
    const target = node.routes[Math.max(0, node.index - count)];
    if (target) run({ type: 'goBackTo', routeKey: target.key }, source);
  };

  const shim = {
    isFocused: () => node.routes[node.index]?.key === routeKey,
    getState: () => projectToStackState(node),
    getId: () => undefined,
    getParent: () => undefined,
    canGoBack: () => node.index > 0,
    addListener: (type: string, cb: (...args: unknown[]) => void) => emitter.on(type, cb),
    emit: (event: { type: string; data?: unknown; target?: string }) => emitter.emit(event),
    setOptions: () => {}, // per-screen options projection is a later phase
    setParams: () => {}, // param updates need the deferred `replace` primitive (P-15)
    replaceParams: () => {}, // only strips the no-animation param, which the new model never sets
    goBack: () => run({ type: 'goBack' }),
    dispatch: (action: { type: string; payload?: { count?: number }; source?: string }) => {
      // A native-origin action (header back / dismiss gesture) carries `source`; tag the commit so
      // the render layer can reconcile without re-animating (P-6).
      const source: NavCommit['source'] = action.source ? 'native' : 'js';
      switch (action.type) {
        case 'GO_BACK':
          run({ type: 'goBack' }, source);
          break;
        case 'POP':
          pop(action.payload?.count ?? 1, source);
          break;
        case 'POP_TO_TOP': {
          const anchor = node.routes[0];
          if (anchor) run({ type: 'goBackTo', routeKey: anchor.key }, source);
          break;
        }
      }
    },
  };

  return shim as unknown as NativeStackNavigationProp<ParamListBase>;
}
