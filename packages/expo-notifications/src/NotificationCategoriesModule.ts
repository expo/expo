import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import { NotificationAction, NotificationCategory } from './Notifications.types';

export interface NotificationCategoriesModule extends ProxyNativeModule {
  getNotificationCategoriesAsync: () => Promise<NotificationCategory[]>;
  setNotificationCategoryAsync: (
    name: string,
    actions: NotificationAction[],
    previewPlaceholder?: string
  ) => Promise<void>;
  deleteNotificationCategoryAsync: (identifier: string) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationCategoriesModule as any) as NotificationCategoriesModule;
