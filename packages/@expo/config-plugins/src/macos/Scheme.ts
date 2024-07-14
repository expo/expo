import * as AppleImpl from '../apple/Scheme';

export const withScheme = AppleImpl.withScheme('macos');
export const setScheme = AppleImpl.setScheme('macos');

export {
  getScheme,
  appendScheme,
  removeScheme,
  hasScheme,
  getSchemesFromPlist,
} from '../apple/Scheme';
