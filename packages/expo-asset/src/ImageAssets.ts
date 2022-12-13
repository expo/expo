/* eslint-env browser */
import { Platform } from 'expo-modules-core';

import { getFilename } from './AssetUris';

type ImageInfo = {
  name: string;
  width: number;
  height: number;
};

export function isImageType(type: string): boolean {
  return /^(jpeg|jpg|gif|png|bmp|webp|heic)$/i.test(type);
}

export function getImageInfoAsync(url: string): Promise<ImageInfo> {
  if (!Platform.isDOMAvailable) {
    return Promise.resolve({ name: getFilename(url), width: 0, height: 0 });
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      resolve({
        name: getFilename(url),
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = url;
  });
}
