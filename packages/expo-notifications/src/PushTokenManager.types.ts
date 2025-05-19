import { NativeModule } from 'expo-modules-core';

export type PushTokenManagerModuleEvents = {
  onDevicePushToken: (params: { devicePushToken: string }) => void;
};

export class PushTokenManagerModule extends NativeModule<PushTokenManagerModuleEvents> {
  getDevicePushTokenAsync?: () => Promise<string>;
  unregisterForNotificationsAsync?: () => Promise<void>;
}
