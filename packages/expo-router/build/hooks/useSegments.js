"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSegments = useSegments;
const useRouteInfo_1 = require("../global-state/useRouteInfo");
function useSegments() {
    return (0, useRouteInfo_1.useRouteInfo)().segments;
}
//# sourceMappingURL=useSegments.js.map