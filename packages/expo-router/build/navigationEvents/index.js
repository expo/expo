const availableEvents = [
    'pageWillRender',
    'pageFocused',
    'pageBlurred',
    'pageRemoved',
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
export function emit(type, event) {
    const subscribersForEvent = subscribers[type];
    if (subscribersForEvent) {
        for (const callback of subscribersForEvent) {
            callback(event);
        }
    }
}
let enabled = false;
let currentPathname = undefined;
let currentParams = undefined;
let currentPathnameListener = undefined;
export const unstable_navigationEvents = {
    addListener,
    emit,
    enable: () => {
        enabled = true;
    },
    isEnabled: () => {
        return enabled;
    },
    saveCurrentPathname: () => {
        if (!enabled || currentPathnameListener)
            return;
        currentPathnameListener = addListener('pageFocused', (event) => {
            currentPathname = event.pathname;
            currentParams = event.params;
        });
    },
    get currentPathname() {
        return currentPathname;
    },
    get currentParams() {
        return currentParams;
    },
};
if (globalThis.expo) {
    globalThis.expo.router = globalThis.expo.router || {};
    if (!('navigationEvents' in globalThis.expo.router)) {
        Object.defineProperties(globalThis.expo.router, {
            navigationEvents: {
                get() {
                    return unstable_navigationEvents;
                },
                enumerable: true,
            },
            currentPathname: {
                get() {
                    return currentPathname;
                },
                enumerable: true,
            },
            currentParams: {
                get() {
                    return currentParams;
                },
                enumerable: true,
            },
        });
    }
}
//# sourceMappingURL=index.js.map