"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDrawerStatus = useDrawerStatus;
const react_1 = require("react");
const DrawerStatusContext_1 = require("./DrawerStatusContext");
/**
 * Hook to detect if the drawer's status in a parent navigator.
 * Returns 'open' if the drawer is open, 'closed' if the drawer is closed.
 */
function useDrawerStatus() {
    const drawerStatus = (0, react_1.use)(DrawerStatusContext_1.DrawerStatusContext);
    if (drawerStatus === undefined) {
        throw new Error("Couldn't find a drawer. Is your component inside a drawer navigator?");
    }
    return drawerStatus;
}
//# sourceMappingURL=useDrawerStatus.js.map