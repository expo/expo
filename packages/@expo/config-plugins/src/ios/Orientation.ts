import * as AppleImpl from '../apple/Orientation';

export const withOrientation = AppleImpl.withOrientation('ios');

export { getOrientation, PORTRAIT_ORIENTATIONS, LANDSCAPE_ORIENTATIONS, setOrientation } from '../apple/Orientation';
