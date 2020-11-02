import { ProxyNativeModule } from '@unimodules/core';

export interface InstallationIdProvider extends ProxyNativeModule {
  getInstallationIdAsync?: () => Promise<string>;
  getRegistrationsAsync?: () => Promise<{ [scope: string]: true }>;
  setRegistrationAsync?: (scope: string, isRegistered: boolean) => Promise<void>;
}
