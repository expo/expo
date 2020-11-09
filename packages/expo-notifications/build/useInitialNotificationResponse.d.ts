import { NotificationResponse } from './Notifications.types';
/**
 * Returns an initial notification response if the app
 * was opened as a result of tapping on a notification,
 * null if the app doesn't seem to be opened as a result
 * of tapping on a notification, or undefined until we are sure
 * of which to return.
 */
export default function useInitialNotificationResponse(): NotificationResponse | null | undefined;
