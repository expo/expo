'use client';
import { use } from 'react';
import { NavigationContainerRefContext } from './NavigationContainerRefContext';
import { NavigationContext } from './NavigationContext';
/**
 * Hook to access the navigation prop of the parent screen anywhere.
 *
 * @returns Navigation prop of the parent screen.
 */
export function useNavigation() {
    const root = use(NavigationContainerRefContext);
    const navigation = use(NavigationContext);
    if (navigation === undefined && root === undefined) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    // FIXME: Figure out a better way to do this
    return (navigation ?? root);
}
//# sourceMappingURL=useNavigation.js.map