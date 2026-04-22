import { useEffect, useSyncExternalStore } from 'react';
import { router } from './global-state/router';
import { routingQueue } from './global-state/routing';
export { router };
export function useImperativeApiEmitter(ref) {
    const events = useSyncExternalStore(routingQueue.subscribe, routingQueue.snapshot, routingQueue.snapshot);
    useEffect(() => {
        routingQueue.run(ref);
    }, [events, ref]);
    return null;
}
//# sourceMappingURL=imperative-api.js.map