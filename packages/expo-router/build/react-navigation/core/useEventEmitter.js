'use client';
import * as React from 'react';
/**
 * Hook to manage the event system used by the navigator to notify screens of various events.
 */
export function useEventEmitter(listen) {
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