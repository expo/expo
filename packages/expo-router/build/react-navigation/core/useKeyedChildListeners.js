'use client';
import * as React from 'react';
/**
 * Hook which lets child navigators add getters to be called for obtaining rehydrated state.
 */
export function useKeyedChildListeners() {
    const { current: keyedListeners } = React.useRef(Object.assign(Object.create(null), {
        getState: {},
        beforeRemove: {},
    }));
    const addKeyedListener = React.useCallback((type, key, listener) => {
        // @ts-expect-error: according to ref stated above you can use `key` to index type
        keyedListeners[type][key] = listener;
        return () => {
            // @ts-expect-error: according to ref stated above you can use `key` to index type
            keyedListeners[type][key] = undefined;
        };
    }, [keyedListeners]);
    return {
        keyedListeners,
        addKeyedListener,
    };
}
//# sourceMappingURL=useKeyedChildListeners.js.map