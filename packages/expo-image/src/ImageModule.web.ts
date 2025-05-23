import { NativeModule, registerWebModule } from 'expo-modules-core';

import type { ImageNativeModule, ImageRef, ImageSource } from './Image.types';
import ImageRefWeb from './web/ImageRef';

class ImageModule extends NativeModule implements ImageNativeModule {
  Image: typeof ImageRef = ImageRefWeb;

  async prefetch(urls: string | string[], _: unknown, __: unknown): Promise<boolean> {
    const urlsArray = Array.isArray(urls) ? urls : [urls];

    return new Promise<boolean>((resolve) => {
      let imagesLoaded = 0;

      urlsArray.forEach((url) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          imagesLoaded++;

          if (imagesLoaded === urlsArray.length) {
            resolve(true);
          }
        };
        img.onerror = () => resolve(false);
      });
    });
  }

  async clearMemoryCache(): Promise<boolean> {
    return false;
  }

  async clearDiskCache(): Promise<boolean> {
    return false;
  }

  async loadAsync(source: ImageSource): Promise<ImageRef> {
    if (!source.uri) {
      // TODO: Add support for sources without the uri, e.g. blurhash and thumbhash.
      throw new Error('The image source must have the "uri" property defined');
    }
    const response = await fetch(source.uri, {
      headers: source.headers,
    });

    if (!response.ok) {
      throw new Error(`Image request failed with the status code: ${response.status}`);
    }
    const blob = await response.blob();
    const imageObjectUrl = URL.createObjectURL(blob);
    const image = await loadImageElementAsync(imageObjectUrl);

    return ImageRefWeb.init(
      imageObjectUrl,
      image.width,
      image.height,
      response.headers.get('Content-Type')
    );
  }
}

/**
 * Helper that resolves to an `<img />` element once it finishes loading the given source.
 */
async function loadImageElementAsync(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement('img');

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to load the image from '${src}'`));
    image.src = src;
  });
}

export default registerWebModule(ImageModule, 'ExpoImage');
