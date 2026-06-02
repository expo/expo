import { type RefObject } from 'react';
import type { ImperativeRouter } from './global-state/router';
import { router } from './global-state/router';
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
export declare function useImperativeApiEmitter(ref: RefObject<NavigationContainerRef<ParamListBase> | null>): null;
//# sourceMappingURL=imperative-api.d.ts.map