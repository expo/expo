import { isRunningInExpoGo } from 'expo';

function areWeTestingWithJest() {
  return process.env.JEST_WORKER_ID !== undefined || process.env.NODE_ENV?.toLowerCase() === 'test';
}

if (isRunningInExpoGo() && !areWeTestingWithJest()) {
  const message =
    '`expo-notifications` functionality is not fully supported in Expo Go:\n' +
    'We recommend you instead use a development build to avoid limitations. Learn more: https://expo.fyi/dev-client.';
  console.warn(message);
}

export { getDevicePushTokenAsync } from './getDevicePushTokenAsync';
export { unregisterForNotificationsAsync } from './unregisterForNotificationsAsync';
export { getExpoPushTokenAsync } from './getExpoPushTokenAsync';
export { subscribeToTopicAsync, unsubscribeFromTopicAsync } from './topicSubscription';
export { getPresentedNotificationsAsync } from './getPresentedNotificationsAsync';
export { dismissNotificationAsync } from './dismissNotificationAsync';
export { dismissAllNotificationsAsync } from './dismissAllNotificationsAsync';
export { getNotificationChannelsAsync } from './getNotificationChannelsAsync';
export { getNotificationChannelAsync } from './getNotificationChannelAsync';
export { setNotificationChannelAsync } from './setNotificationChannelAsync';
export { deleteNotificationChannelAsync } from './deleteNotificationChannelAsync';
export { getNotificationChannelGroupsAsync } from './getNotificationChannelGroupsAsync';
export { getNotificationChannelGroupAsync } from './getNotificationChannelGroupAsync';
export { setNotificationChannelGroupAsync } from './setNotificationChannelGroupAsync';
export { deleteNotificationChannelGroupAsync } from './deleteNotificationChannelGroupAsync';
export { getBadgeCountAsync } from './getBadgeCountAsync';
export { setBadgeCountAsync } from './setBadgeCountAsync';
export { getAllScheduledNotificationsAsync } from './getAllScheduledNotificationsAsync';
export { scheduleNotificationAsync } from './scheduleNotificationAsync';
export { cancelScheduledNotificationAsync } from './cancelScheduledNotificationAsync';
export { cancelAllScheduledNotificationsAsync } from './cancelAllScheduledNotificationsAsync';
export { getNotificationCategoriesAsync } from './getNotificationCategoriesAsync';
export { setNotificationCategoryAsync } from './setNotificationCategoryAsync';
export { deleteNotificationCategoryAsync } from './deleteNotificationCategoryAsync';
export { getNextTriggerDateAsync } from './getNextTriggerDateAsync';
export { useLastNotificationResponse } from './useLastNotificationResponse';
export { setAutoServerRegistrationEnabledAsync } from './DevicePushTokenAutoRegistration.fx';
export { registerTaskAsync, BackgroundNotificationTaskResult } from './registerTaskAsync';
export { unregisterTaskAsync } from './unregisterTaskAsync';
export * from './TokenEmitter';
export * from './NotificationsEmitter';
export * from './NotificationsHandler';
export * from './NotificationPermissions';
export * from './NotificationChannelGroupManager.types';
export * from './NotificationChannelManager.types';
export * from './NotificationPermissions.types';
export * from './Notifications.types';
export * from './Tokens.types';
