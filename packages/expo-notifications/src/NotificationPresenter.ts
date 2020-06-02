import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import { Notification, NotificationContentInput, ActionType } from './Notifications.types';

export interface NotificationPresenterModule extends ProxyNativeModule {
  getPresentedNotificationsAsync: () => Promise<Notification[]>;
  presentNotificationAsync: (
    identifier: string,
    content: NotificationContentInput
  ) => Promise<string>;
  dismissNotificationAsync: (identifier: string) => Promise<void>;
  dismissAllNotificationsAsync: () => Promise<void>;
  createCategoryAsync: (
    categoryId: string,
    actions: ActionType[],
    previewPlaceholder?: string | null
  ) => Promise<void>;
  deleteCategoryAsync: (categoryId: string) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationPresenter as any) as NotificationPresenterModule;
