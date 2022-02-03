import { CodedError } from 'expo-modules-core';

export function getContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new CodedError('ERR_IMAGE_MANIPULATOR', 'Failed to create canvas context');
  }
  return ctx;
}
