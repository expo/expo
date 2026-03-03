import { unstable_getMaterialSymbolSourceAsync, type AndroidSymbol } from 'expo-symbols';
import { useEffect, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';

/**
 * Resolves an Android Material Design icon name to an `ImageSourcePropType`.
 * Returns `undefined` while the icon is loading or if `name` is `undefined`.
 *
 * @platform android
 */
export function useMaterialIconSource(
  name: AndroidSymbol | undefined
): ImageSourcePropType | undefined {
  const [source, setSource] = useState<ImageSourcePropType | undefined>(undefined);

  useEffect(() => {
    if (!name) {
      setSource(undefined);
      return;
    }

    setSource(undefined);
    let cancelled = false;

    unstable_getMaterialSymbolSourceAsync(name, 24, 'white')
      .then((result) => {
        if (!cancelled && result) {
          setSource(result);
        }
      })
      .catch(() => {
        console.warn(`[expo-router] Failed to load Material icon "${name}".`);
      });

    return () => {
      cancelled = true;
    };
  }, [name]);

  return source;
}
