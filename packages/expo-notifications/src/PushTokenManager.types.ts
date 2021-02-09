import { ProxyNativeModule } from '@unimodules/core';

export interface PushTokenManagerModule extends ProxyNativeModule {
  getDevicePushTokenAsync?: () => Promise<string>;
}
