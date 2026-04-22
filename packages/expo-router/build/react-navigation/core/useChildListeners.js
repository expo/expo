'use client';
import * as React from 'react';
/**
 * Hook which lets child navigators add action listeners.
 */
export function useChildListeners() {
    const { current: listeners } = React.useRef({
        action: [],
        focus: [],
    });
    const addListener = React.useCallback((type, listener) => {
        listeners[type].push(listener);
        let removed = false;
        return () => {
            const index = listeners[type].indexOf(listener);
            if (!removed && index > -1) {
                removed = true;
                listeners[type].splice(index, 1);
            }
        };
    }, [listeners]);
    return {
        listeners,
        addListener,
    };
}
//# sourceMappingURL=useChildListeners.js.map