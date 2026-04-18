'use client';
import * as React from 'react';
import { use } from 'react';
import { useNavigation } from './useNavigation';
export const FocusedRouteKeyContext = React.createContext(undefined);
export const IsFocusedContext = React.createContext(undefined);
/**
 * Hook to get the current focus state of the screen. Returns a `true` if screen is focused, otherwise `false`.
 * This can be used if a component needs to render something based on the focus state.
 */
export function useIsFocused() {
    const isFocused = use(IsFocusedContext);
    const navigation = useNavigation();
    const isFocusedAvailable = isFocused !== undefined;
    const subscribe = React.useCallback((callback) => {
        if (isFocusedAvailable) {
            // If `isFocused` is available in context
            // We don't need to subscribe to focus and blur events
            return () => { };
        }
        const unsubscribeFocus = navigation.addListener('focus', callback);
        const unsubscribeBlur = navigation.addListener('blur', callback);
        return () => {
            unsubscribeFocus();
            unsubscribeBlur();
        };
    }, [isFocusedAvailable, navigation]);
    // isFocused from context only works with NavigationProvider
    // So this is kept for backward compatibility
    const value = React.useSyncExternalStore(subscribe, navigation.isFocused, navigation.isFocused);
    return isFocused ?? value;
}
//# sourceMappingURL=useIsFocused.js.map