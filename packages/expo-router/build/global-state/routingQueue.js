import { getNavigateAction } from './getNavigationAction';
export const routingQueue = {
    queue: [],
    subscribers: new Set(),
    subscribe(callback) {
        routingQueue.subscribers.add(callback);
        return () => {
            routingQueue.subscribers.delete(callback);
        };
    },
    snapshot() {
        return routingQueue.queue;
    },
    add(action) {
        routingQueue.queue.push(action);
        for (const callback of routingQueue.subscribers) {
            callback();
        }
    },
    run(ref) {
        // Reset the identity of the queue.
        const events = routingQueue.queue;
        routingQueue.queue = [];
        let action;
        while ((action = events.shift())) {
            // TODO: Consider warning when ref.current is null — actions are silently dropped
            if (ref.current) {
                if (action.type === 'ROUTER_LINK') {
                    const { payload: { href, options }, } = action;
                    action = getNavigateAction(href, options, options.event, options.withAnchor, options.dangerouslySingular, !!options.__internal__PreviewKey);
                    // TODO: Consider warning when getNavigateAction returns undefined
                    if (action) {
                        ref.current.dispatch(action);
                    }
                }
                else {
                    ref.current.dispatch(action);
                }
            }
        }
    },
};
//# sourceMappingURL=routingQueue.js.map