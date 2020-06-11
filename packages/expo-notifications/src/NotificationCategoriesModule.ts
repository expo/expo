import { NativeModulesProxy, ProxyNativeModule } from '@unimodules/core';

import { Action } from './Notifications.types';

export interface NotificationCategoriesModule extends ProxyNativeModule {
  createCategoryAsync: (
    name: string,
    actions: Action[],
    previewPlaceholder?: string
  ) => Promise<void>;
  deleteCategoryAsync: (name: string) => Promise<void>;
}

export default (NativeModulesProxy.ExpoNotificationCategoriesModule as any) as NotificationCategoriesModule;
