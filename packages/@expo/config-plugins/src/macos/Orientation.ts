import * as AppleImpl from '../apple/Orientation';

export const withOrientation = AppleImpl.withOrientation('macos');

export {
  getOrientation,
  PORTRAIT_ORIENTATIONS,
  LANDSCAPE_ORIENTATIONS,
  setOrientation,
} from '../apple/Orientation';
