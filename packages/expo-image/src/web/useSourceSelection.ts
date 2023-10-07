import React, { useState, useRef } from 'react';

import { ImageProps, ImageSource } from '../Image.types';
import { isBlurhashString, isThumbhashString } from '../utils/resolveSources';

function findBestSourceForSize(
  sources: ImageSource[] | undefined,
  size: DOMRect | null
): ImageSource | null {
  if (sources?.length === 1) {
    return sources[0];
  }
  return (
    [...(sources || [])]
      // look for the smallest image that's still larger then a container
      ?.map((source) => {
        if (!size) {
          return { source, penalty: 0, covers: false };
        }
        const { width, height } =
          typeof source === 'object' ? source : { width: null, height: null };
        if (width == null || height == null) {
          return { source, penalty: 0, covers: false };
        }
        if (width < size.width || height < size.height) {
          return {
            source,
            penalty: Math.max(size.width - width, size.height - height),
            covers: false,
          };
        }
        return { source, penalty: (width - size.width) * (height - size.height), covers: true };
      })
      .sort((a, b) => a.penalty - b.penalty)
      .sort((a, b) => Number(b.covers) - Number(a.covers))[0]?.source ?? null
  );
}

export interface SrcSetSource extends ImageSource {
  srcset: string;
  sizes: string;
  // used as key and a fallback in case srcset is not supported
  uri: string;
  type: 'srcset';
}

function getCSSMediaQueryForSource(source: ImageSource) {
  return `(max-width: ${source.webMaxViewportWidth ?? source.width}px) ${source.width}px`;
}

function selectSource(
  sources: ImageSource[] | undefined,
  size: DOMRect | null,
  responsivePolicy: ImageProps['responsivePolicy']
): ImageSource | SrcSetSource | null {
  if (sources == null || sources.length === 0) {
    return null;
  }

  if (sources.length === 1) {
    return sources[0];
  }

  if (responsivePolicy !== 'static') {
    return findBestSourceForSize(sources, size);
  }
  const staticSupportedSources = sources
    .filter(
      (s) => s.uri && s.width != null && !isBlurhashString(s.uri) && !isThumbhashString(s.uri)
    )
    .sort(
      (a, b) => (a.webMaxViewportWidth ?? a.width ?? 0) - (b.webMaxViewportWidth ?? b.width ?? 0)
    );

  if (staticSupportedSources.length === 0) {
    console.warn(
      "You've set the `static` responsivePolicy but none of the sources have the `width` properties set. Make sure you set both `width` and `webMaxViewportWidth` for best results when using static responsiveness. Falling back to the `initial` policy."
    );
    return findBestSourceForSize(sources, size);
  }

  const srcset = staticSupportedSources
    ?.map((source) => `${source.uri} ${source.width}w`)
    .join(', ');
  const sizes = `${staticSupportedSources
    ?.map(getCSSMediaQueryForSource)
    .join(', ')}, ${staticSupportedSources[staticSupportedSources.length - 1]?.width}px`;
  return {
    srcset,
    sizes,
    uri: staticSupportedSources[staticSupportedSources.length - 1]?.uri ?? '',
    type: 'srcset',
  };
}

type UseSourceSelectionReturn = {
  containerRef: (element: HTMLDivElement) => void;
  source: ImageSource | SrcSetSource | null;
};

export default function useSourceSelection(
  sources?: ImageSource[],
  responsivePolicy: ImageProps['responsivePolicy'] = 'static',
  measurementCallback?: (target: HTMLElement, size: DOMRect) => void
): UseSourceSelectionReturn {
  const hasMoreThanOneSource = (sources?.length ?? 0) > 1;
  // null - not calculated yet, DOMRect - size available
  const [size, setSize] = useState<null | DOMRect>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);

  React.useEffect(() => {
    return () => {
      resizeObserver.current?.disconnect();
    };
  }, []);

  const containerRef = React.useCallback(
    (element: HTMLDivElement) => {
      // we can't short circuit here since we need to read the size for better animated transitions
      if (!hasMoreThanOneSource && !measurementCallback) {
        return;
      }
      const rect = element?.getBoundingClientRect();
      measurementCallback?.(element, rect);
      setSize(rect);

      if (responsivePolicy === 'live') {
        resizeObserver.current?.disconnect();
        if (!element) {
          return;
        }
        resizeObserver.current = new ResizeObserver((entries) => {
          setSize(entries[0].contentRect);
          measurementCallback?.(entries[0].target as any, entries[0].contentRect);
        });
        resizeObserver.current.observe(element);
      }
    },
    [hasMoreThanOneSource, responsivePolicy]
  );

  const source = selectSource(sources, size, responsivePolicy);

  return React.useMemo(
    () => ({
      containerRef,
      source,
    }),
    [source]
  );
}
