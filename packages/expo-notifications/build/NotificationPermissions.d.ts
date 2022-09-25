import { NotificationPermissionsRequest, NotificationPermissionsStatus } from './NotificationPermissions.types';
export declare function getPermissionsAsync(): Promise<NotificationPermissionsStatus>;
export declare function requestPermissionsAsync(permissions?: NotificationPermissionsRequest): Promise<NotificationPermissionsStatus>;
/**
 * Check or request permissions to send and receive push notifications.
 * This uses both `requestPermissionsAsync` and `getPermissionsAsync` to interact with the permissions.
 *
 * @example
 * ```ts
 * const [status, requestPermission] = Notifications.usePermissions();
 * ```
 */
export declare const usePermissions: (options?: import("expo-modules-core").PermissionHookOptions<NotificationPermissionsRequest> | undefined) => [NotificationPermissionsStatus | null, () => Promise<NotificationPermissionsStatus>, () => Promise<NotificationPermissionsStatus>];
//# sourceMappingURL=NotificationPermissions.d.ts.map