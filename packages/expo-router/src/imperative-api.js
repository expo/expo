import { useEffect, useSyncExternalStore } from 'react';
import { canDismiss, canGoBack, dismiss, dismissAll, dismissTo, goBack, navigate, prefetch, push, reload, replace, routingQueue, setParams, } from './global-state/routing';
/**
 * @hidden
 */
export const router = {
    navigate,
    push,
    dismiss,
    dismissAll,
    dismissTo,
    canDismiss,
    replace,
    back: () => goBack(),
    canGoBack,
    reload,
    prefetch,
    setParams: setParams,
};
export function useImperativeApiEmitter(ref) {
    const events = useSyncExternalStore(routingQueue.subscribe, routingQueue.snapshot, routingQueue.snapshot);
    useEffect(() => {
        routingQueue.run(ref);
    }, [events, ref]);
    return null;
}
//# sourceMappingURL=imperative-api.js.map