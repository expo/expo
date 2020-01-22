import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

export interface PushTokenManagerModule extends ProxyNativeModule {
  getDevicePushTokenAsync: () => Promise<string>;
}

export default (NativeModulesProxy.ExpoPushTokenManager as any) as PushTokenManagerModule;
