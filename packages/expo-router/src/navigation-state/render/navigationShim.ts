// R-Phase B — the partial react-navigation `navigation` for the reused native views (Decisions R-2).
// Writes resolve WITHIN this node via the behavior seam and commit through `dispatchNav` — RN's
// routers are never in the loop (C12). Cast at the boundary; the object is intentionally partial.
// Cross-navigator navigate and bubbled hardware-back are wired in R-Phase C.

import type { EventEmitter } from './emitter';
import { projectToStackState } from './projectToStackState';
import type { ParamListBase } from '../../react-navigation/native';
import type { NativeStackNavigationProp } from '../../react-navigation/native-stack/types';
import { resolve } from '../behaviors';
import type { NavAction } from '../reducer';
import type { NavNode, PrimitiveOp } from '../types';

export type ShimDeps = {
  /** The navigator node this screen belongs to (current render slice). */
  node: NavNode;
  /** Commit ops to the new store. */
  dispatch: (action: NavAction) => void;
  /** Per-navigator event bus (focus/transitionEnd/…). */
  emitter: EventEmitter;
};

/** Pop `count` routes off the stack (native `dismissCount` / `POP`). */
function popOps(node: NavNode, count: number): PrimitiveOp[] {
  const target = node.routes[Math.max(0, node.index - count)];
  return target ? resolve({ type: 'popTo', routeKey: target.key }, node, 'stack') : [];
}

export function createStackNavigationShim(
  routeKey: string,
  { node, dispatch, emitter }: ShimDeps
): NativeStackNavigationProp<ParamListBase> {
  const commit = (ops: PrimitiveOp[], source: NavAction['source'] = 'js') => {
    if (ops.length) dispatch({ ops, source });
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
    goBack: () => commit(resolve({ type: 'goBack' }, node, 'stack')),
    dispatch: (action: { type: string; payload?: { count?: number }; source?: string }) => {
      // A native-origin action (header back / dismiss gesture) carries `source`; tag the commit so
      // the render layer can reconcile without re-animating (P-6).
      const source: NavAction['source'] = action.source ? 'native' : 'js';
      switch (action.type) {
        case 'GO_BACK':
          commit(resolve({ type: 'goBack' }, node, 'stack'), source);
          break;
        case 'POP':
          commit(popOps(node, action.payload?.count ?? 1), source);
          break;
        case 'POP_TO_TOP':
          commit(resolve({ type: 'popToTop' }, node, 'stack'), source);
          break;
      }
    },
  };

  return shim as unknown as NativeStackNavigationProp<ParamListBase>;
}
