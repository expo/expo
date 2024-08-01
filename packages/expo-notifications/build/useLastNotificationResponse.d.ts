import { NotificationResponse } from './Notifications.types';
type MaybeNotificationResponse = NotificationResponse | null | undefined;
/**
 * A React hook always returns the notification response that was received most recently
 * (a notification response designates an interaction with a notification, such as tapping on it).
 *
 * > If you don't want to use a hook, you can use `Notifications.getLastNotificationResponseAsync()` instead.
 *
 * @return The hook may return one of these three types/values:
 * - `undefined` - until we're sure of what to return,
 * - `null` - if no notification response has been received yet,
 * - a [`NotificationResponse`](#notificationresponse) object - if a notification response was received.
 *
 * @example
 * Responding to a notification tap by opening a URL that could be put into the notification's `data`
 * (opening the URL is your responsibility and is not a part of the `expo-notifications` API):
 * ```jsx
 * import * as Notifications from 'expo-notifications';
 * import { Linking } from 'react-native';
 *
 * export default function App() {
 *   const lastNotificationResponse = Notifications.useLastNotificationResponse();
 *   React.useEffect(() => {
 *     if (
 *       lastNotificationResponse &&
 *       lastNotificationResponse.notification.request.content.data.url &&
 *       lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
 *     ) {
 *       Linking.openURL(lastNotificationResponse.notification.request.content.data.url);
 *     }
 *   }, [lastNotificationResponse]);
 *   return (
 *     // Your app content
 *   );
 * }
 * ```
 * @header listen
 */
export default function useLastNotificationResponse(): MaybeNotificationResponse;
export {};
//# sourceMappingURL=useLastNotificationResponse.d.ts.map