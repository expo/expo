import type { SyntheticEvent } from 'react';

import type { ImageWrapperEvents } from './ImageWrapper.types';
import type { ImageSource } from '../Image.types';
import { isBlurhashString } from '../utils/resolveSources';

export function getImageWrapperEventHandler(
  events: ImageWrapperEvents | undefined,
  source: ImageSource
) {
  return {
    onLoad: (event: SyntheticEvent<HTMLImageElement, Event>) => {
      events?.onLoad?.forEach((e) => e?.(event));

      if (typeof window !== 'undefined') {
        // On Web there is no way to detect when the image gets displayed, but we can assume it happens on the repaint right after the image is successfully loaded.
        window.requestAnimationFrame(() => {
          events?.onDisplay?.forEach((e) => e?.());
        });
      }
    },
    onTransitionEnd: () => events?.onTransitionEnd?.forEach((e) => e?.()),
    onError: () => {
      // A temporary workaround for blurhash blobs throwing opaque errors when used in an img tag.
      if (source?.uri && isBlurhashString(source?.uri)) {
        return;
      }
      events?.onError?.forEach((e) => e?.({ source: source || null }));
    },
  };
}
