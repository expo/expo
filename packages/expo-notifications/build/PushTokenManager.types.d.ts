import { ProxyNativeModule } from 'expo-modules-core';
export interface PushTokenManagerModule extends ProxyNativeModule {
    getDevicePushTokenAsync?: () => Promise<string>;
    unregisterForNotificationsAsync?: () => Promise<void>;
}
//# sourceMappingURL=PushTokenManager.types.d.ts.map