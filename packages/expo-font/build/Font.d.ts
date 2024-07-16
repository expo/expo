import { FontDisplay, FontResource, FontSource, UnloadFontOptions } from './Font.types';
/**
 * Used to transform font family names to the scoped name. This does not need to
 * be called in standalone or bare apps, but it will return unscoped font family
 * names if it is called in those contexts.
 *
 * @param fontFamily Name of font to process.
 * @returns Returns a name processed for use with the [current workflow](https://docs.expo.dev/archive/managed-vs-bare/).
 * @deprecated This method is not needed anymore and will be removed in the future.
 */
export declare function processFontFamily(fontFamily: string | null): string | null;
/**
 * Synchronously detect if the font for `fontFamily` has finished loading.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @return Returns `true` if the font has fully loaded.
 */
export declare function isLoaded(fontFamily: string): boolean;
/**
 * Synchronously detect if the font for `fontFamily` is still being loaded.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @returns Returns `true` if the font is still loading.
 */
export declare function isLoading(fontFamily: string): boolean;
/**
 * Highly efficient method for loading fonts from static or remote resources which can then be used
 * with the platform's native text elements. In the browser this generates a `@font-face` block in
 * a shared style sheet for fonts. No CSS is needed to use this method.
 *
 * @template T The type of the first argument. If a string is provided, the second argument must be
 * a `FontSource`. If an object is provided, the second argument must be omitted.
 *
 * @param fontFamilyOrFontMap String or map of values that can be used as the `fontFamily` [style prop](https://reactnative.dev/docs/text#style)
 * with React Native `Text` elements.
 * @param source The font asset that should be loaded into the `fontFamily` namespace. Provide this argument only if the first
 * first argument is a string.
 *
 * @return Returns a promise that fulfils when the font has loaded. Often you may want to wrap the
 * method in a `try/catch/finally` to ensure the app continues if the font fails to load.
 */
export declare function loadAsync<T extends string | Record<string, FontSource>>(...args: T extends string ? [fontFamilyOrFontMap: T, source: FontSource] : [fontFamilyOrFontMap: T]): Promise<void>;
/**
 * Unloads all the custom fonts. This is used for testing.
 */
export declare function unloadAllAsync(): Promise<void>;
/**
 * Unload custom fonts matching the `fontFamily`s and display values provided.
 * Because fonts are automatically unloaded on every platform this is mostly used for testing.
 *
 * @template T The type of the first argument. If a string is provided, the second argument must be
 * an `UnloadFontOptions`. If an object is provided, the second argument must be omitted.
 *
 * @param fontFamilyOrFontMap The name or names of the custom fonts that will be unloaded.
 * @param options When `fontFamilyOrFontMap` is a string, this should be the font source used to load
 * the custom font originally.
 */
export declare function unloadAsync<T extends string | Record<string, UnloadFontOptions>>(...args: T extends string ? [fontFamilyOrFontMap: T, options?: UnloadFontOptions] : [fontFamilyOrFontMap: T]): Promise<void>;
export { FontDisplay, FontResource, FontSource, UnloadFontOptions };
//# sourceMappingURL=Font.d.ts.map