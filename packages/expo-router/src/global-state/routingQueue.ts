import type { NavigationAction } from '../react-navigation/native';
import { store } from './store';
import type { LinkToOptions } from './types';

export interface LinkAction {
  type: 'ROUTER_LINK';
  payload: {
    options: LinkToOptions;
    href: string;
  };
}

// Pre-ready buffer for the context-less imperative API (`router.push`/`navigate`/`back`/…, callable
// from anywhere). Post-ready, every call dispatches the raw intent directly through the container's
// public `dispatch` in the caller's own call stack — no queue, no `useSyncExternalStore` read, no
// effect tick — so a JS-initiated dispatch keeps its `React.startTransition` scope and a link
// resolves against the reducer's chained tree. The only thing buffered is a call made *before* the
// container is ready (e.g. `router.replace` in a root layout's first render): those wait here and
// drain the moment the ref attaches. `router.*` resolution now lives in the reducer, so the buffer
// holds raw *unresolved* intents (`ROUTER_LINK` and the plain `POP`/`GO_BACK`/… actions).
const preReadyActions: (NavigationAction | LinkAction)[] = [];

// The single dispatch funnel. Ready → dispatch the raw intent immediately; not ready → buffer it.
export function dispatchAction(action: NavigationAction | LinkAction) {
  if (store.navigationRef.isReady()) {
    store.navigationRef.dispatch(action as NavigationAction);
  } else {
    preReadyActions.push(action);
  }
}

// Drain the pre-ready buffer once the container is ready. Called from a container commit effect; a
// no-op when the buffer is empty or the ref hasn't attached yet.
export function flushPreReadyActions() {
  if (preReadyActions.length === 0 || !store.navigationRef.isReady()) {
    return;
  }

  const pending = preReadyActions.splice(0, preReadyActions.length);
  for (const action of pending) {
    store.navigationRef.dispatch(action as NavigationAction);
  }
}
