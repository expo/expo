import type { SharedRefType } from 'expo';
import React, { useState } from 'react';

import type { ImageProps, ImageSource } from '../Image.types';
import { isImageRef } from '../utils';
import { isBlurhashString, isThumbhashString } from '../utils/resolveSources';

function findBestSourceForSize(
  sources: ImageSource[] | undefined,
  size: DOMRect | null
): ImageSource | null {
  if (sources?.length === 1) {
    return sources[0] ?? null;
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

function getCSSMediaQueryForSource(source: ImageSource): string | null {
  // Only emit a breakpoint when an explicit `webMaxViewportWidth` is provided.
  // A source's intrinsic `width` is not a viewport breakpoint, so without
  // `webMaxViewportWidth` we leave selection to `sizes="auto"` (and the `100vw`
  // final fallback) instead of guessing one.
  if (source.webMaxViewportWidth == null) {
    return null;
  }
  return `(max-width: ${source.webMaxViewportWidth}px) ${source.width}px`;
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
    return sources[0] ?? null;
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
      "You've set the `static` responsivePolicy but none of the sources have the `width` property set. Set `width` on each source so the browser can build a `srcset` for static responsiveness. Falling back to the `initial` policy."
    );
    return findBestSourceForSize(sources, size);
  }

  const srcset = staticSupportedSources
    ?.map((source) => `${source.uri} ${source.width}w`)
    .join(', ');
  // `sizes` lets the browser pick the best `srcset` candidate for how the image
  // is actually laid out:
  // - `auto` (must be first per the HTML spec) makes supporting browsers measure
  //   the element's rendered width and choose accordingly. It only applies to
  //   lazily-loaded images, which is why the `static` policy defaults to lazy.
  // - Per-source breakpoints are emitted only for sources that set the
  //   (deprecated) `webMaxViewportWidth`, and serve as a fallback for browsers
  //   without `sizes="auto"` support (and for eager-loaded images).
  // - `100vw` is the final fallback when no breakpoint matches; it also matches
  //   the browser default for an absent `sizes` value.
  const sizes = [
    'auto',
    ...staticSupportedSources
      .map(getCSSMediaQueryForSource)
      .filter((query): query is string => query != null),
    '100vw',
  ].join(', ');
  return {
    srcset,
    sizes,
    uri: staticSupportedSources[staticSupportedSources.length - 1]?.uri ?? '',
    type: 'srcset',
  };
}

export default function useSourceSelection(
  sources: ImageSource[] | SharedRefType<'image'> | undefined,
  responsivePolicy: ImageProps['responsivePolicy'] = 'static',
  containerRef: React.RefObject<HTMLDivElement | null>,
  measurementCallback: ((target: HTMLElement, size: DOMRect) => void) | null = null
): ImageSource | SrcSetSource | SharedRefType<'image'> | null {
  const hasMoreThanOneSource = (Array.isArray(sources) ? sources.length : 0) > 1;
  const [size, setSize] = useState<null | DOMRect>(
    containerRef.current?.getBoundingClientRect() ?? null
  );
  if (size && containerRef.current) {
    measurementCallback?.(containerRef.current, size);
  }

  React.useEffect(() => {
    if ((!hasMoreThanOneSource && !measurementCallback) || !containerRef.current) {
      return () => {};
    }
    if (responsivePolicy === 'live') {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        setSize(entry?.contentRect ?? null);
        if (entry != null) {
          measurementCallback?.(entry.target as HTMLElement, entry.contentRect);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => {
        resizeObserver.disconnect();
      };
    }
    return () => {};
  }, [responsivePolicy, hasMoreThanOneSource, containerRef.current, measurementCallback]);

  if (isImageRef(sources)) {
    // There is always only one image ref, so there is nothing else to select from.
    return sources;
  }
  return selectSource(sources, size, responsivePolicy);
}
