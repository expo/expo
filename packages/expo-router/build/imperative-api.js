"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
exports.useImperativeApiEmitter = useImperativeApiEmitter;
const react_1 = require("react");
const router_1 = require("./global-state/router");
Object.defineProperty(exports, "router", { enumerable: true, get: function () { return router_1.router; } });
const routing_1 = require("./global-state/routing");
function useImperativeApiEmitter(ref) {
    const events = (0, react_1.useSyncExternalStore)(routing_1.routingQueue.subscribe, routing_1.routingQueue.snapshot, routing_1.routingQueue.snapshot);
    (0, react_1.useEffect)(() => {
        routing_1.routingQueue.run(ref);
    }, [events, ref]);
    return null;
}
//# sourceMappingURL=imperative-api.js.map