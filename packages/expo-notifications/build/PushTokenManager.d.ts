import { ProxyNativeModule } from '@unimodules/core';
export interface PushTokenManagerModule extends ProxyNativeModule {
    getDevicePushTokenAsync: () => Promise<string>;
}
declare const _default: PushTokenManagerModule;
export default _default;
