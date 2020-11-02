import { ProxyNativeModule } from '@unimodules/core';

export interface ServerRegistrationModule extends ProxyNativeModule {
  getInstallationIdAsync?: () => Promise<string>;
}
