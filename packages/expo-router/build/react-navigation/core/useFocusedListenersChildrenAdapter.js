'use client';
import * as React from 'react';
import { use } from 'react';
import { NavigationBuilderContext, } from './NavigationBuilderContext';
/**
 * Hook for passing focus callback to children
 */
export function useFocusedListenersChildrenAdapter({ navigation, focusedListeners }) {
    const { addListener } = use(NavigationBuilderContext);
    const listener = React.useCallback((callback) => {
        if (navigation.isFocused()) {
            for (const listener of focusedListeners) {
                const { handled, result } = listener(callback);
                if (handled) {
                    return { handled, result };
                }
            }
            return { handled: true, result: callback(navigation) };
        }
        else {
            return { handled: false, result: null };
        }
    }, [focusedListeners, navigation]);
    React.useEffect(() => addListener?.('focus', listener), [addListener, listener]);
}
//# sourceMappingURL=useFocusedListenersChildrenAdapter.js.map