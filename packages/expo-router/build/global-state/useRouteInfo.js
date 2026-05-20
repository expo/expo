"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRouteInfo = useRouteInfo;
const react_1 = require("react");
const routeInfoCache_1 = require("./routeInfoCache");
const store_1 = require("./store");
const PreviewRouteContext_1 = require("../link/preview/PreviewRouteContext");
function useRouteInfo() {
    const routeInfo = (0, react_1.useSyncExternalStore)(routeInfoCache_1.routeInfoSubscribe, store_1.store.getRouteInfo, store_1.store.getRouteInfo);
    const { isPreview, segments, params, pathname } = (0, PreviewRouteContext_1.usePreviewInfo)();
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