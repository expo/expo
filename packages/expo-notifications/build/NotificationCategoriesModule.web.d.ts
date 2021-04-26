import { NotificationAction } from './Notifications.types';
declare const _default: {
    getNotificationCategoriesAsync(): Promise<null>;
    setNotificationCategoryAsync(identifier: string, actions: NotificationAction[], options?: object | undefined): Promise<null>;
    deleteNotificationCategoryAsync(identifier: string): Promise<null>;
};
export default _default;
