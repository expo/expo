"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useImperativeApiEmitter = useImperativeApiEmitter;
const react_1 = require("react");
const routing_1 = require("../global-state/routing");
function useImperativeApiEmitter(ref) {
    const events = (0, react_1.useSyncExternalStore)(routing_1.routingQueue.subscribe, routing_1.routingQueue.snapshot, routing_1.routingQueue.snapshot);
    (0, react_1.useEffect)(() => {
        routing_1.routingQueue.run(ref);
    }, [events, ref]);
    return null;
}
//# sourceMappingURL=useImperativeApiEmitter.js.map