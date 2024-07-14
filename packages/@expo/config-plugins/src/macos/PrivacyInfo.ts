import * as AppleImpl from '../apple/PrivacyInfo';

export const withPrivacyInfo = AppleImpl.withPrivacyInfo('macos');
export const setPrivacyInfo = AppleImpl.setPrivacyInfo('macos');

export type { PrivacyInfo } from '../apple/PrivacyInfo';
export { mergePrivacyInfo } from '../apple/PrivacyInfo';
