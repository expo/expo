/* eslint-env browser */
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
