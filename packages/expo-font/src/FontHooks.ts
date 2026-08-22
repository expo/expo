import { useEffect, useState } from 'react';

import { loadAsync, isLoaded } from './Font';
import type { FontMap, UseFontHook } from './Font.types';

function isMapLoaded(map: FontMap) {
  if (typeof map === 'string') {
    return isLoaded(map);
  } else if (Array.isArray(map)) {
    return map.every(({ fontFamily }) => isLoaded(fontFamily));
  } else {
    return Object.keys(map).every((fontFamily) => isLoaded(fontFamily));
  }
}

function useRuntimeFonts(map: FontMap): [boolean, Error | null] {
  const [loaded, setLoaded] = useState(
    // For web rehydration, we need to check if the fonts are already loaded during the static render.
    // Native will also benefit from this optimization.
    isMapLoaded(map)
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadAsync(map)
      .then(() => {
        if (isMounted) {
          setLoaded(true);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setError(error);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return [loaded, error];
}

function useStaticFonts(map: FontMap): [boolean, Error | null] {
  loadAsync(map);
  return [true, null];
}

// @needsAudit
/**
 * Load a map of fonts at runtime with [`loadAsync`](#loadasyncfontfamilyorfontmap-source). This returns `true` if the fonts are
 * loaded and ready to use. It also returns an error if something went wrong, to use in development.
 *
 * > Note, the fonts are not "reloaded" when you dynamically change the font map.
 *
 * @param map A map of `fontFamily`s to [`FontSource`](#fontsource)s, or an array of
 * [`FontFamilyDefinition`](#fontfamilydefinition)s for loading multiple faces (for example
 * different weights or an italic cut) per family. After loading the font you can use the
 * `fontFamily` name in the `fontFamily` style prop of a `Text` element.
 *
 * @return
 * - __loaded__ (`boolean`) - A boolean to detect if the font for `fontFamily` has finished
 * loading.
 * - __error__ (`Error | null`) - An error encountered when loading the fonts.
 *
 * @example
 * ```tsx
 * const [loaded, error] = useFonts({
 *   'Inter-Black': require('./assets/fonts/Inter-Black.otf'),
 * });
 * ```
 *
 * On web, loading multiple weights or styles of the same family lets the browser select the
 * correct face with the CSS `font-weight` and `font-style` properties:
 * ```tsx
 * const [loaded, error] = useFonts([
 *   {
 *     fontFamily: 'Inter',
 *     fontDefinitions: [
 *       { path: require('./assets/fonts/Inter-Regular.otf'), weight: 400 },
 *       { path: require('./assets/fonts/Inter-Italic.otf'), weight: 400, style: 'italic' },
 *       { path: require('./assets/fonts/Inter-Bold.otf'), weight: 700 },
 *     ],
 *   },
 * ]);
 * ```
 */
export const useFonts: UseFontHook =
  typeof window === 'undefined' ? useStaticFonts : useRuntimeFonts;
