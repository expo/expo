import { type RefObject, useEffect, useReducer } from 'react';

import { getRootNavigationStore } from './global-state/navigation-store';
import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
import type { NavigationContainerRef, ParamListBase } from './react-navigation/native';

export type { ImperativeRouter };
export { router };

/**
 * Drains the imperative routing queue into the navigation container whenever an action is enqueued.
 *
 * The module-level `router` (push/replace/navigate/back/preload) can be called from anywhere —
 * before mount, from effects, timers, or native callbacks — so it never touches React directly; it
 * only appends to `routingQueue`. This hook subscribes to the queue and drains it inside an effect,
 * which keeps that out-of-render indirection safe (buffer before mount, defer to commit during
 * render, idempotent under StrictMode because `routingQueue.run` resets the queue identity).
 *
 * Previously this used `useSyncExternalStore` to observe the queue. It now bumps a plain
 * `useReducer` tick instead — the same add → re-render → drain-in-effect path, without the
 * concurrent-mode escape hatch (a prerequisite for moving navigation onto ordinary React state).
 */
export function useImperativeApiEmitter(
  ref: RefObject<NavigationContainerRef<ParamListBase> | null>
) {
  const [tick, bumpTick] = useReducer((count: number) => count + 1, 0);

  // `bumpTick` is identity-stable, so this yields a single live subscription per mount (under
  // StrictMode it is subscribe → cleanup → subscribe, netting one).
  useEffect(() => routingQueue.subscribe(bumpTick), []);

  // SAFETY NET — keep this run unconditional. It drains on mount as well as on every tick, so
  // actions enqueued before the subscribe effect ran (a module-level `router.push` during cold
  // start, or one landing in the StrictMode resubscribe gap) still flush — they fanned out to no
  // subscriber, so nothing else would drain them. Do not gate this on `tick > 0`.
  useEffect(() => {
    const store = getRootNavigationStore();
    if (store) {
      // Collapse the whole drain — each action's bubbling + multi-level focus cascade stages into
      // the live tree — into a single committed tree (one REPLACE_ROOT, one render, one native diff).
      store.batch(() => routingQueue.run(ref));
    } else {
      routingQueue.run(ref);
    }
  }, [tick, ref]);

  return null;
}
