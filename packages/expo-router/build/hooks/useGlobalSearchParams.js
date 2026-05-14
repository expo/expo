"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useGlobalSearchParams = useGlobalSearchParams;
const useRouteInfo_1 = require("../global-state/useRouteInfo");
function useGlobalSearchParams() {
    return (0, useRouteInfo_1.useRouteInfo)().params;
}
//# sourceMappingURL=useGlobalSearchParams.js.map