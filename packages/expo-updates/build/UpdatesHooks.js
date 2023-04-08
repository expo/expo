import { useEffect, useRef } from 'react';
import * as Updates from './Updates';
/**
 * React hook to create an [`UpdateEvent`](#updateevent) listener subscription on mount, using
 * [`addListener`](#updatesaddlistenerlistener). It calls `remove()` on the subscription during unmount.
 *
 * @param listener A function that will be invoked with an [`UpdateEvent`](#updateevent) instance
 * and should not return any value.
 *
 * @example
 * ```ts
 * function App() {
 *   const eventListener = (event) => {
 *     if (event.type === Updates.UpdateEventType.ERROR) {
 *       // Handle error
 *     } else if (event.type === Updates.UpdateEventType.NO_UPDATE_AVAILABLE) {
 *       // Handle no update available
 *     } else if (event.type === Updates.UpdateEventType.UPDATE_AVAILABLE) {
 *       // Handle update available
 *     }
 *   };
 *   Updates.useUpdateEvents(eventListener);
 *   // React Component...
 * }
 * ```
 */
export const useUpdateEvents = (listener) => {
    const listenerRef = useRef();
    useEffect(() => {
        listenerRef.current = listener;
    }, [listener]);
    useEffect(() => {
        if (listenerRef.current) {
            const subscription = Updates.addListener(listenerRef.current);
            return () => {
                subscription.remove();
            };
        }
        return undefined;
    }, []);
};
//# sourceMappingURL=UpdatesHooks.js.map