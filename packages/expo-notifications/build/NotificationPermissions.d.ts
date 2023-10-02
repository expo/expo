import { NotificationPermissionsRequest, NotificationPermissionsStatus } from './NotificationPermissions.types';
/**
 * Calling this function checks current permissions settings related to notifications.
 * It lets you verify whether the app is currently allowed to display alerts, play sounds, etc.
 * There is no user-facing effect of calling this.
 * @return It returns a `Promise` resolving to an object represents permission settings ([`NotificationPermissionsStatus`](#notificationpermissionsstatus)).
 * On iOS, make sure you [properly interpret the permissions response](#interpret-the-ios-permissions-response).
 * @example Check if the app is allowed to send any type of notifications (interrupting and non-interrupting–provisional on iOS).
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export async function allowsNotificationsAsync() {
 *   const settings = await Notifications.getPermissionsAsync();
 *   return (
 *     settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
 *   );
 * }
 * ```
 * @header permissions
 */
export declare function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;
/**
 * Prompts the user for notification permissions according to request. **Request defaults to asking the user to allow displaying alerts,
 * setting badge count and playing sounds**.
 * @param permissions An object representing configuration for the request scope.
 * @return It returns a Promise resolving to an object represents permission settings ([`NotificationPermissionsStatus`](#notificationpermissionsstatus)).
 * On iOS, make sure you [properly interpret the permissions response](#interpret-the-ios-permissions-response).
 * @example Prompts the user to allow the app to show alerts, play sounds, set badge count and let Siri read out messages through AirPods.
 * ```ts
 * import * as Notifications from 'expo-notifications';
 *
 * export function requestPermissionsAsync() {
 *   return await Notifications.requestPermissionsAsync({
 *     ios: {
 *       allowAlert: true,
 *       allowBadge: true,
 *       allowSound: true,
 *       allowAnnouncements: true,
 *     },
 *   });
 * }
 * ```
 * @header permissions
 */
export declare function requestPermissionsAsync(permissions?: NotificationPermissionsRequest): Promise<NotificationPermissionsStatus>;
/**
 * Check or request permissions to send and receive push notifications.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 * @example
 * ```ts
 * const [permissionResponse, requestPermission] = Notifications.usePermissions();
 * ```
 * @header permission
 */
export declare const usePermissions: (options?: import("expo-modules-core").PermissionHookOptions<NotificationPermissionsRequest> | undefined) => [NotificationPermissionsStatus | null, () => Promise<NotificationPermissionsStatus>, () => Promise<NotificationPermissionsStatus>];
//# sourceMappingURL=NotificationPermissions.d.ts.map