export { ImageManipulator, manipulateAsync, useImageManipulator } from './ImageManipulator';

export { SaveOptions, SaveFormat, ImageResult } from './ImageManipulator.types';

// Export types that are deprecated as of SDK 52
export {
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
