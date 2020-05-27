import { useEffect, useState } from 'react';
import { loadAsync } from './Font';
/**
 * Load a map of custom fonts to use in textual elements.
 * The map keys are used as font names, and can be used with `fontFamily: <name>;`.
 * It returns a boolean describing if all fonts are loaded.
 *
 * Note, the fonts are not "reloaded" when you dynamically change the font map.
 *
 * @see https://docs.expo.io/versions/latest/sdk/font/
 * @example const [loaded, error] = useFonts(...);
 */
export function useFonts(map) {
    const [loaded, setLoaded] = useState(false);
    const [error, setError] = useState(null);
    useEffect(() => {
        loadAsync(map)
            .then(() => setLoaded(true))
            .catch(setError);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return [loaded, error];
}
//# sourceMappingURL=FontHooks.js.map