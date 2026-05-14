"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_navigationEvents = void 0;
exports.emit = emit;
const availableEvents = [
    'pagePreloaded',
    'pageFocused',
    'pageBlurred',
    'pageRemoved',
    'actionDispatched',
];
const subscribers = {};
function addListener(eventType, callback) {
    if (!availableEvents.includes(eventType)) {
        throw new Error(`Unsupported event type: ${eventType}`);
    }
    if (!subscribers[eventType]) {
        subscribers[eventType] = new Set();
    }
    subscribers[eventType].add(callback);
    return () => {
        subscribers[eventType].delete(callback);
        if (subscribers[eventType].size === 0) {
            delete subscribers[eventType];
        }
    };
}
function emit(type, event) {
    const subscribersForEvent = subscribers[type];
    if (subscribersForEvent) {
        for (const callback of subscribersForEvent) {
            callback(event);
        }
    }
}
let enabled = false;
exports.unstable_navigationEvents = {
    addListener,
    emit,
    enable: () => {
        enabled = true;
    },
    isEnabled: () => {
        return enabled;
    },
};
//# sourceMappingURL=index.js.map