'use client';
import * as React from 'react';
import { use } from 'react';
import { NavigationBuilderContext } from './NavigationBuilderContext';
/**
 * Hook to handle focus actions for a route.
 * Focus action needs to be treated specially, coz when a nested route is focused,
 * the parent navigators also needs to be focused.
 */
export function useOnRouteFocus({ router, getState, key: sourceRouteKey, setState, }) {
    const { onRouteFocus: onRouteFocusParent } = use(NavigationBuilderContext);
    return React.useCallback((key) => {
        const state = getState();
        const result = router.getStateForRouteFocus(state, key);
        if (result !== state) {
            setState(result);
        }
        if (onRouteFocusParent !== undefined && sourceRouteKey !== undefined) {
            onRouteFocusParent(sourceRouteKey);
        }
    }, [getState, onRouteFocusParent, router, setState, sourceRouteKey]);
}
//# sourceMappingURL=useOnRouteFocus.js.map