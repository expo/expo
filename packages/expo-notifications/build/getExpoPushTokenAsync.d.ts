import { DevicePushToken, ExpoPushToken } from './Tokens.types';
interface Options {
    /**
     * Endpoint URL override.
     */
    baseUrl?: string;
    /**
     * Request URL override.
     */
    url?: string;
    /**
     * Request body override.
     */
    type?: string;
    deviceId?: string;
    /**
     * Makes sense only on iOS, where there are two push notification services: "sandbox" and "production".
     * This defines whether the push token is supposed to be used with the sandbox platform notification service.
     * Defaults to [`Application.getIosPushNotificationServiceEnvironmentAsync()`](/application/#applicationgetiospushnotificationserviceenvironmentasync)
     * exposed by `expo-application` or `false`. Most probably you won't need to customize that.
     * You may want to customize that if you don't want to install `expo-application` and still use the sandbox APNs.
     * @platform ios
     */
    development?: boolean;
    /**
     * @deprecated Use `projectId` instead.
     * The ID of the experience to which the token should be attributed.
     * Defaults to [`Constants.manifest.id`](/constants/#constantsmanifest) exposed by `expo-constants`.
     * When building with EAS Build, or in the bare workflow, **this is required** and you must provide a value which takes the shape `@username/projectSlug`,
     * where `username` is the Expo account that the project is associated with, and `projectSlug` is your [`slug`](/config/app.mdx#slug) from Expo config.
     */
    experienceId?: string;
    /**
     * The ID of the project to which the token should be attributed.
     * Defaults to [`Constants.expoConfig.extra.eas.projectId`](/constants/#easconfig) exposed by `expo-constants`.
     * If you are not using EAS Build, it will fallback to [`Constants.manifest.projectId`](/constants/#constantsmanifest).
     */
    projectId?: string;
    /**
     * The ID of the application to which the token should be attributed.
     * Defaults to [`Application.applicationId`](/application/#applicationapplicationid) exposed by `expo-application`.
     */
    applicationId?: string;
    /**
     * The device push token with which to register at the backend.
     * Defaults to a token fetched with [`getDevicePushTokenAsync()`](#getdevicepushtokenasync-devicepushtoken).
     */
    devicePushToken?: DevicePushToken;
}
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
 *     experienceId: '@username/example',
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
export default function getExpoPushTokenAsync(options?: Options): Promise<ExpoPushToken>;
export {};
//# sourceMappingURL=getExpoPushTokenAsync.d.ts.map