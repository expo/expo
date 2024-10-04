import { useEffect, useMemo, useState } from 'react';

import { OnErrorEvent } from './ImageWrapper.types';
import { ImageNativeProps, ImageSource } from '../Image.types';
import { useBlurhash } from '../utils/blurhash/useBlurhash';
import { isThumbhashString } from '../utils/resolveSources';
import { thumbHashStringToDataURL } from '../utils/thumbhash/thumbhash';

export function useThumbhash(source: ImageSource | null | undefined) {
  const isThumbhash = isThumbhashString(source?.uri || '');
  const strippedThumbhashString = source?.uri?.replace(/thumbhash:\//, '') ?? '';
  const thumbhashSource = useMemo(
    () => (isThumbhash ? { uri: thumbHashStringToDataURL(strippedThumbhashString) } : null),
    [strippedThumbhashString, isThumbhash]
  );
  return thumbhashSource;
}

export function useImageHashes(source: ImageSource | null | undefined) {
  const thumbhash = useThumbhash(source);
  const blurhash = useBlurhash(source);
  return useMemo(
    () => ({
      resolvedSource: blurhash ?? thumbhash ?? source,
      isImageHash: !!blurhash || !!thumbhash,
    }),
    [blurhash, thumbhash]
  );
}

export function useHeaders(
  source: ImageSource | null | undefined,
  cachePolicy: ImageNativeProps['cachePolicy'],
  onError?: OnErrorEvent[]
): ImageSource | null | undefined {
  const [objectURL, setObjectURL] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      if (!source?.headers || !source.uri) {
        return;
      }
      try {
        const result = await fetch(source.uri, {
          headers: source.headers,
          cache: cachePolicy === 'none' ? 'no-cache' : 'default',
          redirect: 'follow',
        });
        if (!result.ok) {
          throw new Error(`Failed to fetch image: ${result.status} ${result.statusText}`);
        }
        const blob = await result.blob();
        setObjectURL((prevObjURL) => {
          if (prevObjURL) {
            URL.revokeObjectURL(prevObjURL);
          }
          return URL.createObjectURL(blob);
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        onError?.forEach((e) => e?.({ source }));
      }
    })();
  }, [source]);
  if (!source?.headers) {
    return source;
  }
  if (!objectURL) {
    // Avoid fetching a URL without headers if we have headers
    return null;
  }
  return { ...source, uri: objectURL };
}
