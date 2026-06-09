"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
exports.useImperativeApiEmitter = useImperativeApiEmitter;
const react_1 = require("react");
const navigation_store_1 = require("./global-state/navigation-store");
const router_1 = require("./global-state/router");
Object.defineProperty(exports, "router", { enumerable: true, get: function () { return router_1.router; } });
const routing_1 = require("./global-state/routing");
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
function useImperativeApiEmitter(ref) {
    const [tick, bumpTick] = (0, react_1.useReducer)((count) => count + 1, 0);
    // `bumpTick` is identity-stable, so this yields a single live subscription per mount (under
    // StrictMode it is subscribe → cleanup → subscribe, netting one).
    (0, react_1.useEffect)(() => routing_1.routingQueue.subscribe(bumpTick), []);
    // SAFETY NET — keep this run unconditional. It drains on mount as well as on every tick, so
    // actions enqueued before the subscribe effect ran (a module-level `router.push` during cold
    // start, or one landing in the StrictMode resubscribe gap) still flush — they fanned out to no
    // subscriber, so nothing else would drain them. Do not gate this on `tick > 0`.
    (0, react_1.useEffect)(() => {
        const store = (0, navigation_store_1.getRootNavigationStore)();
        if (store) {
            // Collapse the whole drain — each action's bubbling + multi-level focus cascade stages into
            // the live tree — into a single committed tree (one REPLACE_ROOT, one render, one native diff).
            store.batch(() => routing_1.routingQueue.run(ref));
        }
        else {
            routing_1.routingQueue.run(ref);
        }
    }, [tick, ref]);
    return null;
}
//# sourceMappingURL=imperative-api.js.map