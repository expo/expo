import { ExpoPushToken, ExpoPushTokenOptions } from './Tokens.types';
/**
 * Returns an Expo token that can be used to send a push notification to the device using Expo's push notifications service.
 *
 * This method makes requests to the Expo's servers. It can get rejected in cases where the request itself fails
 * (for example, due to the device being offline, experiencing a network timeout, or other HTTPS request failures).
 * To provide offline support to your users, you should `try/catch` this method and implement retry logic to attempt
 * to get the push token later, once the device is back online.
 *
 * > For Expo's backend to be able to send notifications to your app, you will need to provide it with push notification keys.
 * For more information, see [credentials](/push-notifications/push-notifications-setup/#get-credentials-for-development-builds) in the push notifications setup.
 *
 * @param options Object allowing you to pass in push notification configuration.
 * @return Returns a `Promise` that resolves to an object representing acquired push token.
 * @header fetch
 *
 * @example
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export async function registerForPushNotificationsAsync(userId: string) {
 *   const expoPushToken = await Notifications.getExpoPushTokenAsync({
 *    projectId: 'your-project-id',
 *   });
 *
 *   await fetch('https://example.com/', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify({
 *       userId,
 *       expoPushToken,
 *     }),
 *   });
 * }
 * ```
 */
export default function getExpoPushTokenAsync(options?: ExpoPushTokenOptions): Promise<ExpoPushToken>;
//# sourceMappingURL=getExpoPushTokenAsync.d.ts.map