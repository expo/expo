import { useEffect, useState } from 'react';
import { isLoaded, loadAsync } from './Font';
function isMapLoaded(map) {
    if (typeof map === 'string') {
        return isLoaded(map);
    }
    else {
        return Object.keys(map).every((fontFamily) => isLoaded(fontFamily));
    }
}
function useRuntimeFonts(...args) {
    const [map, source] = args;
    const [loaded, setLoaded] = useState(
    // For web rehydration, we need to check if the fonts are already loaded during the static render.
    // Native will also benefit from this optimization.
    isMapLoaded(map));
    const [error, setError] = useState(null);
    useEffect(() => {
        if (typeof map === 'object') {
            loadAsync(map)
                .then(() => setLoaded(true))
                .catch(setError);
        }
        else {
            // we can safely cast source because we know that the first argument is a string and the second is required
            loadAsync(map, source)
                .then(() => setLoaded(true))
                .catch(setError);
        }
    }, []);
    return [loaded, error];
}
function useStaticFonts(...args) {
    const [map, source] = args;
    if (typeof map === 'object') {
        loadAsync(map);
    }
    else {
        // we can safely cast source because we know that the first argument is a string and the second is required
        loadAsync(map, source);
    }
    return [true, null];
}
// @needsAudit
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
export const useFonts = typeof window === 'undefined' ? useStaticFonts : useRuntimeFonts;
//# sourceMappingURL=FontHooks.js.map