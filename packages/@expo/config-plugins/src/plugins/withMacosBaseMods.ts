import * as AppleImpl from './withAppleBaseMods';

export const withMacosBaseMods = AppleImpl.withAppleBaseMods('macos');
export const getMacosModFileProviders = AppleImpl.getAppleModFileProviders('macos');
