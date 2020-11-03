import { ProxyNativeModule } from '@unimodules/core';
export interface ServerRegistrationModule extends ProxyNativeModule {
    getInstallationIdAsync?: () => Promise<string>;
    getLastRegistrationInfoAsync?: () => Promise<string | undefined | null>;
    setLastRegistrationInfoAsync?: (lastRegistrationInfo: string | null) => Promise<void>;
}
