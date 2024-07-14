import * as AppleImpl from '../apple/Entitlements';

export const withAssociatedDomains = AppleImpl.withAssociatedDomains('macos');

export const setAssociatedDomains = AppleImpl.setAssociatedDomains('macos');

export const getEntitlementsPath = AppleImpl.getEntitlementsPath('macos');

export const ensureApplicationTargetEntitlementsFileConfigured =
  AppleImpl.ensureApplicationTargetEntitlementsFileConfigured('macos');
