'use client';
import { useSyncExternalStore } from 'react';
import { routeInfoSubscribe } from './routeInfoCache';
import { store } from './store';
import { usePreviewInfo } from '../link/preview/PreviewRouteContext';
export function useRouteInfo() {
    const routeInfo = useSyncExternalStore(routeInfoSubscribe, store.getRouteInfo, store.getRouteInfo);
    const { isPreview, segments, params, pathname } = usePreviewInfo();
    if (isPreview) {
        return {
            pathname: pathname ?? '',
            segments: segments ?? [],
            unstable_globalHref: '',
            params: params ?? {},
            searchParams: new URLSearchParams(),
            pathnameWithParams: pathname ?? '',
            isIndex: false,
        };
    }
    return routeInfo;
}
//# sourceMappingURL=useRouteInfo.js.map