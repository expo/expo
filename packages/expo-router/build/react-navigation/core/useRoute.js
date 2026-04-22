'use client';
import { use } from 'react';
import { NavigationRouteContext } from './NavigationProvider';
/**
 * Hook to access the route prop of the parent screen anywhere.
 *
 * @returns Route prop of the parent screen.
 */
export function useRoute() {
    const route = use(NavigationRouteContext);
    if (route === undefined) {
        throw new Error("Couldn't find a route object. Is your component inside a screen in a navigator?");
    }
    return route;
}
//# sourceMappingURL=useRoute.js.map