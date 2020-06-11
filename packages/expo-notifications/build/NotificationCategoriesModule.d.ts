import { ProxyNativeModule } from '@unimodules/core';
import { Action, Category } from './Notifications.types';
export interface NotificationCategoriesModule extends ProxyNativeModule {
    getCategoriesAsync: () => Promise<Category[]>;
    createCategoryAsync: (name: string, actions: Action[], previewPlaceholder?: string) => Promise<void>;
    deleteCategoryAsync: (name: string) => Promise<void>;
}
declare const _default: NotificationCategoriesModule;
export default _default;
