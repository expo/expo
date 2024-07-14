import * as AppleImpl from '../apple/Entitlements';

export const withAssociatedDomains = AppleImpl.withAssociatedDomains('ios');

export const setAssociatedDomains = AppleImpl.setAssociatedDomains('ios');

export const getEntitlementsPath = AppleImpl.getEntitlementsPath('ios');

export const ensureApplicationTargetEntitlementsFileConfigured = AppleImpl.ensureApplicationTargetEntitlementsFileConfigured('ios');
