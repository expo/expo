import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import {
  NotificationChannelGroup,
  NotificationChannelGroupInput,
} from './NotificationChannelGroupManager.types';

export interface NotificationChannelGroupManager extends ProxyNativeModule {
  getNotificationChannelGroupsAsync: () => Promise<NotificationChannelGroup[]>;
  getNotificationChannelGroupAsync: (groupId: string) => Promise<NotificationChannelGroup | null>;
  setNotificationChannelGroupAsync: (
    groupId: string,
    group: NotificationChannelGroupInput
  ) => Promise<NotificationChannelGroup | null>;
  deleteNotificationChannelGroupAsync: (groupId: string) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationChannelGroupManager as any) as NotificationChannelGroupManager;
