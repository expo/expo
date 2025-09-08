import { useCallback, useEffect, useRef, useState } from 'react';
import { useLinkPreviewContext } from './LinkPreviewContext';
import { getPreloadedRouteFromRootStateByHref, getTabPathFromRootStateByHref } from './utils';
import { store } from '../../global-state/router-store';
import { useRouter } from '../../hooks';
export function useNextScreenId() {
    const router = useRouter();
    const { setOpenPreviewKey } = useLinkPreviewContext();
    const [internalNextScreenId, internalSetNextScreenId] = useState();
    const currentHref = useRef(undefined);
    const [tabPath, setTabPath] = useState([]);
    useEffect(() => {
        // When screen is prefetched, then the root state is updated with the preloaded route.
        return store.navigationRef.addListener('state', ({ data: { state } }) => {
            // If we have the current href, it means that we prefetched the route
            if (currentHref.current && state) {
                const preloadedRoute = getPreloadedRouteFromRootStateByHref(currentHref.current, state);
                const routeKey = preloadedRoute?.key;
                const tabPathFromRootState = getTabPathFromRootStateByHref(currentHref.current, state);
                // Without this timeout react-native does not have enough time to mount the new screen
                // and thus it will not be found on the native side
                if (routeKey || tabPathFromRootState.length) {
                    setTimeout(() => {
                        internalSetNextScreenId(routeKey);
                        setOpenPreviewKey(routeKey);
                        setTabPath(tabPathFromRootState);
                    });
                }
                // We got the preloaded state, so we can reset the currentHref
                // to prevent unnecessary processing
                currentHref.current = undefined;
            }
        });
    }, []);
    const prefetch = useCallback((href) => {
        // Resetting the nextScreenId to undefined
        internalSetNextScreenId(undefined);
        router.prefetch(href);
        currentHref.current = href;
    }, [router.prefetch]);
    return [{ nextScreenId: internalNextScreenId, tabPath }, prefetch];
}
//# sourceMappingURL=useNextScreenId.js.map