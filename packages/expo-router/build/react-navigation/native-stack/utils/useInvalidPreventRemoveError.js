'use client';
import * as React from 'react';
import { usePreventRemoveContext } from '../../native';
export function useInvalidPreventRemoveError(descriptors) {
    const { preventedRoutes } = usePreventRemoveContext();
    const preventedRouteKey = Object.keys(preventedRoutes)[0];
    const preventedDescriptor = descriptors[preventedRouteKey];
    const isHeaderBackButtonMenuEnabledOnPreventedScreen = preventedDescriptor?.options?.headerBackButtonMenuEnabled;
    const preventedRouteName = preventedDescriptor?.route?.name;
    React.useEffect(() => {
        if (preventedRouteKey != null && isHeaderBackButtonMenuEnabledOnPreventedScreen) {
            const message = `The screen ${preventedRouteName} uses 'usePreventRemove' hook alongside 'headerBackButtonMenuEnabled: true', which is not supported. \n\n` +
                `Consider removing 'headerBackButtonMenuEnabled: true' from ${preventedRouteName} screen to get rid of this error.`;
            console.error(message);
        }
    }, [preventedRouteKey, isHeaderBackButtonMenuEnabledOnPreventedScreen, preventedRouteName]);
}
//# sourceMappingURL=useInvalidPreventRemoveError.js.map