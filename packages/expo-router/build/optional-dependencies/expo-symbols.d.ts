/**
 * Lazy, cached accessor for `expo-symbols`.
 *
 * `expo-symbols` is declared as an optional peer dependency. The native-tabs
 * Android Material icon converter is the only runtime consumer — type-only
 * imports of `AndroidSymbol` from `expo-symbols` are erased at compile time
 * and don't go through this accessor.
 */
type ExpoSymbols = typeof import('expo-symbols');
/**
 * @param feature Short description of the feature requiring `expo-symbols`,
 *                included verbatim in the thrown error (e.g. "Material icons in `NativeTabs`").
 */
export declare function getExpoSymbols(feature: string): ExpoSymbols;
export {};
//# sourceMappingURL=expo-symbols.d.ts.map