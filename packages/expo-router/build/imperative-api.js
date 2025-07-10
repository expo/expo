"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
exports.ImperativeApiEmitter = ImperativeApiEmitter;
const react_1 = require("react");
const routing_1 = require("./global-state/routing");
/**
 * @hidden
 */
exports.router = {
    navigate: routing_1.navigate,
    push: routing_1.push,
    dismiss: routing_1.dismiss,
    dismissAll: routing_1.dismissAll,
    dismissTo: routing_1.dismissTo,
    canDismiss: routing_1.canDismiss,
    replace: routing_1.replace,
    back: () => (0, routing_1.goBack)(),
    canGoBack: routing_1.canGoBack,
    reload: routing_1.reload,
    prefetch: routing_1.prefetch,
    setParams: routing_1.setParams,
};
function ImperativeApiEmitter() {
    const events = (0, react_1.useSyncExternalStore)(routing_1.routingQueue.subscribe, routing_1.routingQueue.snapshot, routing_1.routingQueue.snapshot);
    (0, react_1.useEffect)(() => {
        routing_1.routingQueue.run();
    }, [events]);
    return null;
}
//# sourceMappingURL=imperative-api.js.map