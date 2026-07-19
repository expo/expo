export { ImageManipulator, manipulateAsync, useImageManipulator } from './ImageManipulator';

// SaveFormat and FlipType are enums
export { SaveFormat, FlipType } from './ImageManipulator.types';

export type { SaveOptions, ImageResult } from './ImageManipulator.types';

// Export types that are deprecated as of SDK 52
export type {
  ActionResize,
  ActionRotate,
  ActionFlip,
  ActionCrop,
  ActionExtent,
  Action,
} from './ImageManipulator.types';

export type { ImageRef } from './ImageRef';
export type { ImageManipulatorContext } from './ImageManipulatorContext';
