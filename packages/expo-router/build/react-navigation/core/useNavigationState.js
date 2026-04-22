'use client';
import React, { use } from 'react';
import useLatestCallback from '../../utils/useLatestCallback';
import { useSyncExternalStoreWithSelector } from '../../utils/useSyncExternalStoreWithSelector';
/**
 * Hook to get a value from the current navigation state using a selector.
 *
 * @param selector Selector function to get a value from the state.
 */
export function useNavigationState(selector) {
    const stateListener = use(NavigationStateListenerContext);
    if (stateListener == null) {
        throw new Error("Couldn't get the navigation state. Is your component inside a navigator?");
    }
    const value = useSyncExternalStoreWithSelector(stateListener.subscribe, 
    // @ts-expect-error: this is unsafe, but needed to make the generic work
    stateListener.getState, stateListener.getState, selector);
    return value;
}
export function NavigationStateListenerProvider({ state, children, }) {
    const listeners = React.useRef([]);
    const stateRef = React.useRef(state);
    const getState = useLatestCallback(() => stateRef.current);
    const subscribe = useLatestCallback((callback) => {
        listeners.current.push(callback);
        return () => {
            listeners.current = listeners.current.filter((cb) => cb !== callback);
        };
    });
    React.useLayoutEffect(() => {
        stateRef.current = state;
        listeners.current.forEach((callback) => callback());
    }, [state]);
    const context = React.useMemo(() => ({
        getState,
        subscribe,
    }), [getState, subscribe]);
    return (<NavigationStateListenerContext.Provider value={context}>
      {children}
    </NavigationStateListenerContext.Provider>);
}
const NavigationStateListenerContext = React.createContext(undefined);
//# sourceMappingURL=useNavigationState.js.map