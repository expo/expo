import { useEffect, useState } from 'react';

import { loadAsync, isLoaded } from './Font';
import { FontSource } from './Font.types';

function isMapLoaded(map: string | Record<string, FontSource>) {
  if (typeof map === 'string') {
    return isLoaded(map);
  } else {
    return Object.keys(map).every((fontFamily) => isLoaded(fontFamily));
  }
}

function useRuntimeFonts(map: string | Record<string, FontSource>): [boolean, Error | null] {
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

function useStaticFonts(map: string | Record<string, FontSource>): [boolean, Error | null] {
  loadAsync(map);
  return [true, null];
}

// @needsAudit
/**
 * Load a map of fonts with [`loadAsync`](#loadasyncfontfamilyorfontmap-source). This returns a `boolean` if the fonts are
 * loaded and ready to use. It also returns an error if something went wrong, to use in development.
 *
 * > Note, the fonts are not "reloaded" when you dynamically change the font map.
 *
 * @param map A map of `fontFamily`s to [`FontSource`](#fontsource)s. After loading the font you can
 * use the key in the `fontFamily` style prop of a `Text` element.
 *
 * @return
 * - __loaded__ (`boolean`) - A boolean to detect if the font for `fontFamily` has finished
 * loading.
 * - __error__ (`Error | null`) - An error encountered when loading the fonts.
 *
 * @example
 * ```tsx
 * const [loaded, error] = useFonts({ ... });
 * ```
 */
export const useFonts: (map: string | Record<string, FontSource>) => [boolean, Error | null] =
  typeof window === 'undefined' ? useStaticFonts : useRuntimeFonts;
