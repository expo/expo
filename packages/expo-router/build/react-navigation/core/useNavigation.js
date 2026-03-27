"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNavigation = useNavigation;
const react_1 = require("react");
const NavigationContainerRefContext_1 = require("./NavigationContainerRefContext");
const NavigationContext_1 = require("./NavigationContext");
/**
 * Hook to access the navigation prop of the parent screen anywhere.
 *
 * @returns Navigation prop of the parent screen.
 */
function useNavigation() {
    const root = (0, react_1.use)(NavigationContainerRefContext_1.NavigationContainerRefContext);
    const navigation = (0, react_1.use)(NavigationContext_1.NavigationContext);
    if (navigation === undefined && root === undefined) {
        throw new Error("Couldn't find a navigation object. Is your component inside NavigationContainer?");
    }
    // FIXME: Figure out a better way to do this
    return (navigation ?? root);
}
//# sourceMappingURL=useNavigation.js.map