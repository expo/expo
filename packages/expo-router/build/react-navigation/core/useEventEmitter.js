"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useEventEmitter = useEventEmitter;
const React = __importStar(require("react"));
/**
 * Hook to manage the event system used by the navigator to notify screens of various events.
 */
function useEventEmitter(listen) {
    const listenRef = React.useRef(listen);
    React.useEffect(() => {
        listenRef.current = listen;
    });
    const listeners = React.useRef(Object.create(null));
    const create = React.useCallback((target) => {
        const removeListener = (type, callback) => {
            const callbacks = listeners.current[type] ? listeners.current[type][target] : undefined;
            if (!callbacks) {
                return;
            }
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
        const addListener = (type, callback) => {
            listeners.current[type] = listeners.current[type] || {};
            listeners.current[type][target] = listeners.current[type][target] || [];
            listeners.current[type][target].push(callback);
            let removed = false;
            return () => {
                // Prevent removing other listeners when unsubscribing same listener multiple times
                if (!removed) {
                    removed = true;
                    removeListener(type, callback);
                }
            };
        };
        return {
            addListener,
            removeListener,
        };
    }, []);
    const emit = React.useCallback(({ type, data, target, canPreventDefault, }) => {
        const items = listeners.current[type] || {};
        // Copy the current list of callbacks in case they are mutated during execution
        const callbacks = target !== undefined
            ? items[target]?.slice()
            : []
                .concat(...Object.keys(items).map((t) => items[t]))
                .filter((cb, i, self) => self.lastIndexOf(cb) === i);
        const event = {
            get type() {
                return type;
            },
        };
        if (target !== undefined) {
            Object.defineProperty(event, 'target', {
                enumerable: true,
                get() {
                    return target;
                },
            });
        }
        if (data !== undefined) {
            Object.defineProperty(event, 'data', {
                enumerable: true,
                get() {
                    return data;
                },
            });
        }
        if (canPreventDefault) {
            let defaultPrevented = false;
            Object.defineProperties(event, {
                defaultPrevented: {
                    enumerable: true,
                    get() {
                        return defaultPrevented;
                    },
                },
                preventDefault: {
                    enumerable: true,
                    value() {
                        defaultPrevented = true;
                    },
                },
            });
        }
        listenRef.current?.(event);
        callbacks?.forEach((cb) => cb(event));
        return event;
    }, []);
    return React.useMemo(() => ({ create, emit }), [create, emit]);
}
//# sourceMappingURL=useEventEmitter.js.map