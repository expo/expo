import * as AppleImpl from '../apple/PrivacyInfo';

export const withPrivacyInfo = AppleImpl.withPrivacyInfo('ios');
export const setPrivacyInfo = AppleImpl.setPrivacyInfo('ios');

export type { PrivacyInfo } from '../apple/PrivacyInfo';
export { mergePrivacyInfo } from '../apple/PrivacyInfo';