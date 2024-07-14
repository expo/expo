import * as AppleImpl from '../apple/Scheme';

export const withScheme = AppleImpl.withScheme('ios');
export const setScheme = AppleImpl.setScheme('ios');

export { getScheme, appendScheme, removeScheme, hasScheme, getSchemesFromPlist } from '../apple/Scheme';