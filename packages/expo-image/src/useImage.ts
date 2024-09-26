'use client';

import { DependencyList, useEffect, useRef, useState } from 'react';

import { Image } from './Image';
import type { ImageRef, ImageSource, UseImageHookOptions } from './Image.types';
import { resolveSource } from './utils/resolveSources';

/**
 * A hook that loads an image from the given source and returns a reference
 * to the native image instance, or `null` until the first image is successfully loaded.
 *
 * It loads a new image every time the `uri` of the provided source changes.
 * To trigger reloads in some other scenarios, you can provide an additional dependency list.
 * @platform android
 * @platform ios
 * @platform web
 */
export function useImage(
  source: ImageSource | string,
  options: UseImageHookOptions = {},
  dependencies: DependencyList = []
): ImageRef | null {
  const resolvedSource = resolveSource(source) as ImageSource;
  const [image, setImage] = useState<ImageRef | null>(null);

  // Since options are not dependencies of the below effect, we store them in a ref.
  // Once the image is asynchronously loaded, the effect will use the most recent options,
  // instead of the captured ones (especially important for callbacks that may change in subsequent renders).
  const optionsRef = useRef<UseImageHookOptions>(options);
  optionsRef.current = options;

  useEffect(() => {
    // We're doing some asynchronous action in this effect, so we should keep track
    // if the effect was already cleaned up. In that case, the async action shouldn't change the state.
    let isEffectValid = true;

    function loadImage() {
      Image.loadAsync(resolvedSource)
        .then((image) => {
          if (isEffectValid) {
            setImage(image);
          }
        })
        .catch((error) => {
          if (!isEffectValid) {
            return;
          }
          if (optionsRef.current.onError) {
            optionsRef.current.onError(error, loadImage);
          } else {
            // Print unhandled errors to the console.
            console.error(
              `Loading an image from '${resolvedSource.uri}' failed, use 'onError' option to handle errors and suppress this message`
            );
            console.error(error);
          }
        });
    }

    loadImage();

    return () => {
      // Invalidate the effect and release the shared object to free up memory.
      isEffectValid = false;
      image?.release();
    };
  }, [resolvedSource.uri, ...dependencies]);

  return image;
}
