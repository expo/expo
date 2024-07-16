import { FontSource } from './Font.types';
/**
 * Load a map of fonts with [`loadAsync`](#loadasyncfontfamilyorfontmap-source). This returns a `boolean` if the fonts are
 * loaded and ready to use. It also returns an error if something went wrong, to use in development.
 *
 * > Note, the fonts are not "reloaded" when you dynamically change the font map.
 *
 * @template T The type of the first argument. If a string is provided, the second argument must be
 * a `FontSource`. If an object is provided, the second argument must be omitted.
 *
 * @param map A map of `fontFamily`s to [`FontSource`](#fontsource)s or a `fontFamily` as a string. After loading the font
 * you can use the key in the `fontFamily` style prop of a `Text` element. If the first argument is a string, the second
 * argument is required.
 * @param source The font asset that should be loaded into the `fontFamily` namespace. Provide this argument only if the first
 * first argument is a string.
 *
 * @return
 * - __loaded__ (`boolean`) - A boolean to detect if the font for `fontFamily` has finished
 * loading.
 * - __error__ (`Error | null`) - An error encountered when loading the fonts.
 *
 * @example
 * Load fonts from a map of `fontFamily`s to [`FontSource`](#fontsource)s:
 * ```tsx
 * const [loaded, error] = useFonts({ ... });
 * ```
 *
 * @example
 * Load a single font by providing a `fontFamily` as a string and a [`FontSource`](#fontsource):
 * ```tsx
 * const [loaded, error] = useFonts("Inter_900Black", require("./assets/fonts/Inter-Black.ttf"));
 * ```
 */
export declare const useFonts: <T extends string | Record<string, FontSource>>(...args: T extends string ? [map: T, source: FontSource] : [map: T]) => [boolean, Error | null];
//# sourceMappingURL=FontHooks.d.ts.map