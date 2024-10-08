import { isRunningInExpoGo } from 'expo';
function areWeTestingWithJest() {
    return process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV === 'TEST';
}
if (isRunningInExpoGo() && !areWeTestingWithJest()) {
    const message = '`expo-notifications` functionality is not fully supported in Expo Go:\n' +
        'We recommend you instead use a development build to avoid limitations. Learn more: https://expo.fyi/dev-client.';
    console.warn(message);
}
export { default as getDevicePushTokenAsync } from './getDevicePushTokenAsync';
export { default as unregisterForNotificationsAsync } from './unregisterForNotificationsAsync';
export { default as getExpoPushTokenAsync } from './getExpoPushTokenAsync';
export { default as getPresentedNotificationsAsync } from './getPresentedNotificationsAsync';
export { default as presentNotificationAsync } from './presentNotificationAsync';
export { default as dismissNotificationAsync } from './dismissNotificationAsync';
export { default as dismissAllNotificationsAsync } from './dismissAllNotificationsAsync';
export { default as getNotificationChannelsAsync } from './getNotificationChannelsAsync';
export { default as getNotificationChannelAsync } from './getNotificationChannelAsync';
export { default as setNotificationChannelAsync } from './setNotificationChannelAsync';
export { default as deleteNotificationChannelAsync } from './deleteNotificationChannelAsync';
export { default as getNotificationChannelGroupsAsync } from './getNotificationChannelGroupsAsync';
export { default as getNotificationChannelGroupAsync } from './getNotificationChannelGroupAsync';
export { default as setNotificationChannelGroupAsync } from './setNotificationChannelGroupAsync';
export { default as deleteNotificationChannelGroupAsync } from './deleteNotificationChannelGroupAsync';
export { default as getBadgeCountAsync } from './getBadgeCountAsync';
export { default as setBadgeCountAsync } from './setBadgeCountAsync';
export { default as getAllScheduledNotificationsAsync } from './getAllScheduledNotificationsAsync';
export { default as scheduleNotificationAsync } from './scheduleNotificationAsync';
export { default as cancelScheduledNotificationAsync } from './cancelScheduledNotificationAsync';
export { default as cancelAllScheduledNotificationsAsync } from './cancelAllScheduledNotificationsAsync';
export { default as getNotificationCategoriesAsync } from './getNotificationCategoriesAsync';
export { default as setNotificationCategoryAsync } from './setNotificationCategoryAsync';
export { default as deleteNotificationCategoryAsync } from './deleteNotificationCategoryAsync';
export { default as getNextTriggerDateAsync } from './getNextTriggerDateAsync';
export { default as useLastNotificationResponse } from './useLastNotificationResponse';
export { setAutoServerRegistrationEnabledAsync } from './DevicePushTokenAutoRegistration.fx';
export { default as registerTaskAsync } from './registerTaskAsync';
export { default as unregisterTaskAsync } from './unregisterTaskAsync';
export * from './TokenEmitter';
export * from './NotificationsEmitter';
export * from './NotificationsHandler';
export * from './NotificationPermissions';
export * from './NotificationChannelGroupManager.types';
export * from './NotificationChannelManager.types';
export * from './NotificationPermissions.types';
export * from './Notifications.types';
export * from './Tokens.types';
//# sourceMappingURL=index.js.map