"use strict";
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.useLocale = useLocale;
const react_1 = require("react");
const LocaleDirContext_1 = require("./LocaleDirContext");
/**
 * Hook to access the text direction specified in the `NavigationContainer`.
 */
function useLocale() {
    const direction = (0, react_1.use)(LocaleDirContext_1.LocaleDirContext);
    if (direction === undefined) {
        throw new Error("Couldn't determine the text direction. Is your component inside NavigationContainer?");
    }
    return { direction };
}
//# sourceMappingURL=useLocale.js.map