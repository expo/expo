"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routingQueue = void 0;
const getNavigationAction_1 = require("./getNavigationAction");
exports.routingQueue = {
    queue: [],
    subscribers: new Set(),
    subscribe(callback) {
        exports.routingQueue.subscribers.add(callback);
        return () => {
            exports.routingQueue.subscribers.delete(callback);
        };
    },
    snapshot() {
        return exports.routingQueue.queue;
    },
    add(action) {
        exports.routingQueue.queue.push(action);
        for (const callback of exports.routingQueue.subscribers) {
            callback();
        }
    },
    run(ref) {
        // Reset the identity of the queue.
        const events = exports.routingQueue.queue;
        exports.routingQueue.queue = [];
        let action;
        while ((action = events.shift())) {
            // TODO: Consider warning when ref.current is null — actions are silently dropped
            if (ref.current) {
                if (action.type === 'ROUTER_LINK') {
                    const { payload: { href, options }, } = action;
                    action = (0, getNavigationAction_1.getNavigateAction)(href, options, options.event, options.withAnchor, options.dangerouslySingular, !!options.__internal__PreviewKey);
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