import { ProxyNativeModule } from 'expo-modules-core';
export interface PushTokenManagerModule extends ProxyNativeModule {
    getDevicePushTokenAsync?: () => Promise<string>;
}
//# sourceMappingURL=PushTokenManager.types.d.ts.map