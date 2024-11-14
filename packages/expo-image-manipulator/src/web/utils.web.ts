import { CodedError } from 'expo-modules-core';

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
