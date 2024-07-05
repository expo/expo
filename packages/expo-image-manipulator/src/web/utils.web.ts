import { CodedError } from 'expo-modules-core';

import { ImageResult, SaveOptions } from '../ImageManipulator.types';

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CodedError('ERR_IMAGE_MANIPULATOR', 'Failed to create canvas context');
  }
  return ctx;
}

export function getResults(canvas: HTMLCanvasElement, options?: SaveOptions): ImageResult {
  let uri: string;
  if (options) {
    const { format = 'png' } = options;
    if (options.format === 'png' && options.compress !== undefined) {
      console.warn('compress is not supported with png format.');
    }
    const quality = Math.min(1, Math.max(0, options.compress ?? 1));
    uri = canvas.toDataURL('image/' + format, quality);
  } else {
    // defaults to PNG with no loss
    uri = canvas.toDataURL();
  }
  return {
    uri,
    width: canvas.width,
    height: canvas.height,
    base64: uri.replace(/^data:image\/\w+;base64,/, ''),
  };
}

export function loadImageAsync(uri: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const imageSource = new Image();
    imageSource.crossOrigin = 'anonymous';
    const canvas = document.createElement('canvas');
    imageSource.onload = () => {
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;

      const context = getContext(canvas);
      context.drawImage(imageSource, 0, 0, imageSource.naturalWidth, imageSource.naturalHeight);

      resolve(canvas);
    };
    imageSource.onerror = () => reject(canvas);
    imageSource.src = uri;
  });
}
