import * as AppleImpl from './withAppleBaseMods';

export const withIosBaseMods = AppleImpl.withAppleBaseMods('ios');
export const getIosModFileProviders = AppleImpl.getAppleModFileProviders('ios');
