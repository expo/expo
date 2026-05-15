"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NOT_INITIALIZED_ERROR = void 0;
exports.createNavigationContainerRef = createNavigationContainerRef;
const routers_1 = require("../routers");
exports.NOT_INITIALIZED_ERROR = "The 'navigation' object hasn't been initialized yet. This might happen if you don't have a navigator mounted, or if the navigator hasn't finished mounting. See https://reactnavigation.org/docs/navigating-without-navigation-prop#handling-initialization for more details.";
function createNavigationContainerRef() {
    const methods = [
        ...Object.keys(routers_1.CommonActions),
        'addListener',
        'removeListener',
        'resetRoot',
        'dispatch',
        'isFocused',
        'canGoBack',
        'getRootState',
        'getState',
        'getParent',
        'getCurrentRoute',
        'getCurrentOptions',
    ];
    const listeners = {};
    const removeListener = (event, callback) => {
        if (listeners[event]) {
            listeners[event] = listeners[event].filter((cb) => cb !== callback);
        }
    };
    let current = null;
    const ref = {
        get current() {
            return current;
        },
        set current(value) {
            current = value;
            if (value != null) {
                Object.entries(listeners).forEach(([event, callbacks]) => {
                    callbacks.forEach((callback) => {
                        value.addListener(event, callback);
                    });
                });
            }
        },
        isReady: () => {
            if (current == null) {
                return false;
            }
            return current.isReady();
        },
        ...methods.reduce((acc, name) => {
            acc[name] = (...args) => {
                if (current == null) {
                    switch (name) {
                        case 'addListener': {
                            const [event, callback] = args;
                            listeners[event] = listeners[event] || [];
                            listeners[event].push(callback);
                            return () => removeListener(event, callback);
                        }
                        case 'removeListener': {
                            const [event, callback] = args;
                            removeListener(event, callback);
                            break;
                        }
                        default:
                            console.error(exports.NOT_INITIALIZED_ERROR);
                    }
                }
                else {
                    // @ts-expect-error: this is ok
                    return current[name](...args);
                }
            };
            return acc;
        }, {}),
    };
    return ref;
}
//# sourceMappingURL=createNavigationContainerRef.js.map