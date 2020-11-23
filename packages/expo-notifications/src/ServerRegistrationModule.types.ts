import { ProxyNativeModule } from '@unimodules/core';

export interface ServerRegistrationModule extends ProxyNativeModule {
  getInstallationIdAsync?: () => Promise<string>;
  getRegistrationInfoAsync?: () => Promise<string | undefined | null>;
  setRegistrationInfoAsync?: (registrationInfo: string | null) => Promise<void>;
}
