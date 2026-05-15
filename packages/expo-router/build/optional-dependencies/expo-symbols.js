"use strict";
/**
 * Lazy, cached accessor for `expo-symbols`.
 *
 * `expo-symbols` is declared as an optional peer dependency. The native-tabs
 * Android Material icon converter is the only runtime consumer — type-only
 * imports of `AndroidSymbol` from `expo-symbols` are erased at compile time
 * and don't go through this accessor.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExpoSymbols = getExpoSymbols;
function missingMessage(feature) {
    return ("Cannot load optional peer dependency 'expo-symbols'. " +
        `${feature} relies on 'expo-symbols' but the package isn't installed. ` +
        'Install it with `npx expo install expo-symbols`.');
}
const MISSING = Symbol('missing');
let expoSymbols;
/**
 * @param feature Short description of the feature requiring `expo-symbols`,
 *                included verbatim in the thrown error (e.g. "Material icons in `NativeTabs`").
 */
function getExpoSymbols(feature) {
    if (expoSymbols === undefined) {
        try {
            expoSymbols = require('expo-symbols');
        }
        catch {
            expoSymbols = MISSING;
        }
    }
    if (expoSymbols === MISSING || !expoSymbols) {
        throw new Error(missingMessage(feature));
    }
    return expoSymbols;
}
//# sourceMappingURL=expo-symbols.js.map