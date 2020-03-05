import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import { NotificationChannel, NotificationChannelInput } from './NotificationChannelManager.types';

export { NotificationChannel, NotificationChannelInput } from './NotificationChannelManager.types';

export interface NotificationChannelManager extends ProxyNativeModule {
  getNotificationChannelsAsync: () => Promise<NotificationChannel[] | null>;
  getNotificationChannelAsync: (channelId: string) => Promise<NotificationChannel | null>;
  setNotificationChannelAsync: (
    channelId: string,
    channelConfiguration: NotificationChannelInput
  ) => Promise<NotificationChannel | null>;
  deleteNotificationChannelAsync: (channelId: string) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationChannelManager as any) as NotificationChannelManager;
