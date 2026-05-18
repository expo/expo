"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigationContainerRef = useNavigationContainerRef;
const store_1 = require("../global-state/store");
/**
 * @return The root `<NavigationContainer />` ref for the app. The `ref.current` may be `null`
 * if the `<NavigationContainer />` hasn't mounted yet.
 */
function useNavigationContainerRef() {
    return store_1.store.navigationRef;
}
//# sourceMappingURL=useNavigationContainerRef.js.map