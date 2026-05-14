"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUnstableGlobalHref = useUnstableGlobalHref;
const useRouteInfo_1 = require("../global-state/useRouteInfo");
/**
 * @private
 * @returns The current global pathname with query params attached. This may change in the future to include the hostname
 * from a predefined universal link. For example, `/foobar?hey=world` becomes `https://acme.dev/foobar?hey=world`.
 */
function useUnstableGlobalHref() {
    return (0, useRouteInfo_1.useRouteInfo)().unstable_globalHref;
}
//# sourceMappingURL=useUnstableGlobalHref.js.map