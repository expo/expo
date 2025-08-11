import { FontDisplay, FontSource, FontResource, UnloadFontOptions } from './Font.types';
/**
 * Synchronously detect if the font for `fontFamily` has finished loading.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @return Returns `true` if the font has fully loaded.
 */
export declare function isLoaded(fontFamily: string): boolean;
/**
 * Synchronously get all the fonts that have been loaded.
 * This includes fonts that were bundled at build time using the config plugin, as well as those loaded at runtime using `loadAsync`.
 *
 * @returns Returns array of strings which you can use as `fontFamily` [style prop](https://reactnative.dev/docs/text#style).
 */
export declare function getLoadedFonts(): string[];
/**
 * Synchronously detect if the font for `fontFamily` is still being loaded.
 *
 * @param fontFamily The name used to load the `FontResource`.
 * @returns Returns `true` if the font is still loading.
 */
export declare function isLoading(fontFamily: string): boolean;
/**
 * An efficient method for loading fonts from static or remote resources which can then be used
 * with the platform's native text elements. In the browser, this generates a `@font-face` block in
 * a shared style sheet for fonts. No CSS is needed to use this method.
 *
 * > **Note**: We recommend using the [config plugin](#configuration-in-app-config) instead whenever possible.
 *
 * @param fontFamilyOrFontMap String or map of values that can be used as the `fontFamily` [style prop](https://reactnative.dev/docs/text#style)
 * with React Native `Text` elements.
 * @param source The font asset that should be loaded into the `fontFamily` namespace.
 *
 * @return Returns a promise that fulfils when the font has loaded. Often you may want to wrap the
 * method in a `try/catch/finally` to ensure the app continues if the font fails to load.
 */
export declare function loadAsync(fontFamilyOrFontMap: string | Record<string, FontSource>, source?: FontSource): Promise<void>;
/**
 * Unloads all the custom fonts. This is used for testing.
 * @hidden
 */
export declare function unloadAllAsync(): Promise<void>;
/**
 * Unload custom fonts matching the `fontFamily`s and display values provided.
 * This is used for testing.
 *
 * @param fontFamilyOrFontMap The name or names of the custom fonts that will be unloaded.
 * @param options When `fontFamilyOrFontMap` is a string, this should be the font source used to load
 * the custom font originally.
 * @hidden
 */
export declare function unloadAsync(fontFamilyOrFontMap: string | Record<string, UnloadFontOptions>, options?: UnloadFontOptions): Promise<void>;
export { FontDisplay, FontSource, FontResource, UnloadFontOptions };
//# sourceMappingURL=Font.d.ts.map