"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useRootNavigation = useRootNavigation;
const store_1 = require("../global-state/store");
/**
 * @deprecated Use [`useNavigationContainerRef`](#usenavigationcontainerref) instead,
 * which returns a React `ref`.
 */
function useRootNavigation() {
    return store_1.store.navigationRef.current;
}
//# sourceMappingURL=useRootNavigation.js.map