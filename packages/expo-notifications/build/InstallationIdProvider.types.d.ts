import { ProxyNativeModule } from '@unimodules/core';
export interface InstallationIdProvider extends ProxyNativeModule {
    getInstallationIdAsync?: () => Promise<string>;
}
