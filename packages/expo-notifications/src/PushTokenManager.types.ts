import { ProxyNativeModule } from 'expo/internal';

export interface PushTokenManagerModule extends ProxyNativeModule {
  getDevicePushTokenAsync?: () => Promise<string>;
  unregisterForNotificationsAsync?: () => Promise<void>;
}
