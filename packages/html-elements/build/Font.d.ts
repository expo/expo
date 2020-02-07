import { FontDisplay, FontSource, FontResource, UnloadFontOptions } from './Font.types';
/**
 * Used to transform font family names to the scoped name. This does not need to
 * be called in standalone or bare apps but it will return unscoped font family
 * names if it is called in those contexts.
 * note(brentvatne): at some point we may want to warn if this is called
 * outside of a managed app.
 *
 * @param fontFamily name to process
 * @returns a name processed for use with the [current workflow](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/)
 */
export declare function processFontFamily(fontFamily: string | null): string | null;
/**
 * Synchronously detect if the font for `fontFamily` has finished loading
 *
 * @param fontFamily the name used to load the `FontResource`.
 * @returns `true` if the the font has fully loaded.
 */
export declare function isLoaded(fontFamily: string): boolean;
/**
 * Synchronously detect if the font for `fontFamily` is still being loaded
 *
 * @param fontFamily the name used to load the `FontResource`.
 * @returns `true` if the the font is still loading.
 */
export declare function isLoading(fontFamily: string): boolean;
/**
 * Natively load a font for use with Text elements.
 * @param fontFamilyOrFontMap string or map of values that can be used as the [`fontFamily`](https://facebook.github.io/react-native/docs/text#style) style prop with React Native Text elements.
 * @param source the font asset that should be loaded into the `fontFamily` namespace.
 */
export declare function loadAsync(fontFamilyOrFontMap: string | {
    [fontFamily: string]: FontSource;
}, source?: FontSource): Promise<void>;
/**
 * Unloads all of the custom fonts. This is used for testing.
 */
export declare function unloadAllAsync(): Promise<void>;
/**
 * Unload custom fonts matching the `fontFamily`s and display values provided.
 * Because fonts are automatically unloaded on every platform this is mostly used for testing.
 *
 * @param fontFamilyOrFontMap the names of the custom fonts that will be unloaded.
 * @param source when `fontFamilyOrFontMap` is a string, this should be the font source used to load the custom font originally.
 */
export declare function unloadAsync(fontFamilyOrFontMap: string | {
    [fontFamily: string]: UnloadFontOptions;
}, options?: UnloadFontOptions): Promise<void>;
export { FontDisplay, FontSource, FontResource, UnloadFontOptions };
