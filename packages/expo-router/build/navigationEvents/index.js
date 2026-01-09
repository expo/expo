"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unstable_navigationEvents = void 0;
exports.emit = emit;
const availableEvents = [
    'pageWillRender',
    'pageFocused',
    'pageBlurred',
    'pageRemoved',
];
let isAfterInitialRender = false;
let hasListener = false;
const subscribers = {};
function addListener(eventType, callback) {
    if (isAfterInitialRender) {
        console.warn('[expo-router] unstable_analytics.addListener was called after the initial render. Analytics listeners should be added in the global scope before first render of your app, preferably in a root _layout.tsx');
        return () => { };
    }
    if (!availableEvents.includes(eventType)) {
        throw new Error(`Unsupported event type: ${eventType}`);
    }
    hasListener = true;
    if (!subscribers[eventType]) {
        subscribers[eventType] = new Set();
    }
    subscribers[eventType].add(callback);
    return () => {
        subscribers[eventType].delete(callback);
        if (subscribers[eventType].size === 0) {
            delete subscribers[eventType];
        }
        hasListener = Object.keys(subscribers).length > 0;
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
exports.unstable_navigationEvents = {
    addListener,
    emit,
    hasAnyListener() {
        return hasListener;
    },
    markInitialRender() {
        isAfterInitialRender = true;
    },
};
//# sourceMappingURL=index.js.map