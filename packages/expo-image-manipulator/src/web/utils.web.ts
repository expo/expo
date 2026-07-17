import { CodedError } from 'expo';

import type { ImageLoadOptions } from '../ImageManipulator.types';

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CodedError('ERR_IMAGE_MANIPULATOR', 'Failed to create canvas context');
  }
  return ctx;
}

export async function blobToBase64String(blob: Blob): Promise<string> {
  const dataURL = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error(`Unable to convert blob to base64 string: ${reader.error}`));
    reader.readAsDataURL(blob);
  });
  return dataURL.replace(/^data:image\/\w+;base64,/, '');
}

export function loadImageAsync(
  uri: string,
  options?: ImageLoadOptions
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const imageSource = new Image();
    imageSource.crossOrigin = 'anonymous';
    const canvas = document.createElement('canvas');
    imageSource.onload = () => {
      const { width, height } = boundedSize(
        imageSource.naturalWidth,
        imageSource.naturalHeight,
        options?.maxWidth,
        options?.maxHeight
      );
      canvas.width = width;
      canvas.height = height;

      const context = getContext(canvas);
      context.drawImage(imageSource, 0, 0, width, height);

      resolve(canvas);
    };
    imageSource.onerror = () => reject(canvas);
    imageSource.src = uri;
  });
}

/**
 * Computes the size that bounds an image of the given dimensions to `maxWidth`/`maxHeight`,
 * preserving the aspect ratio. Images that already fit within the bounds keep their size.
 */
export function boundedSize(
  width: number,
  height: number,
  maxWidth: number | undefined,
  maxHeight: number | undefined
): { width: number; height: number } {
  let scale = 1;
  if (maxWidth && maxWidth > 0) {
    scale = Math.min(scale, maxWidth / width);
  }
  if (maxHeight && maxHeight > 0) {
    scale = Math.min(scale, maxHeight / height);
  }
  if (scale >= 1) {
    return { width, height };
  }
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
