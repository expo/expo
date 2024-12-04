export { ImageManipulator, manipulateAsync, useImageManipulator } from './ImageManipulator';

// SaveFormat is an enum
export { SaveFormat } from './ImageManipulator.types';

export type { SaveOptions, ImageResult } from './ImageManipulator.types';

// Export types that are deprecated as of SDK 52
export type {
  ActionResize,
  ActionRotate,
  FlipType,
  ActionFlip,
  ActionCrop,
  ActionExtent,
  Action,
} from './ImageManipulator.types';

export type { ImageRef } from './ImageRef';
export type { ImageManipulatorContext } from './ImageManipulatorContext';
