import { PermissionResponse, PermissionHookOptions } from 'expo-modules-core';

export enum IosAlertStyle {
  NONE = 0,
  BANNER = 1,
  ALERT = 2,
}

export enum IosAllowsPreviews {
  NEVER = 0,
  ALWAYS = 1,
  WHEN_AUTHENTICATED = 2,
}

export enum IosAuthorizationStatus {
  NOT_DETERMINED = 0,
  DENIED = 1,
  AUTHORIZED = 2,
  PROVISIONAL = 3,
  EPHEMERAL = 4,
}

export { PermissionHookOptions };

// @docsMissing
export interface NotificationPermissionsStatus extends PermissionResponse {
  android?: {
    importance: number;
    interruptionFilter?: number;
  };
  ios?: {
    status: IosAuthorizationStatus;
    allowsDisplayInNotificationCenter: boolean | null;
    allowsDisplayOnLockScreen: boolean | null;
    allowsDisplayInCarPlay: boolean | null;
    allowsAlert: boolean | null;
    allowsBadge: boolean | null;
    allowsSound: boolean | null;
    allowsCriticalAlerts?: boolean | null;
    alertStyle: IosAlertStyle;
    allowsPreviews?: IosAllowsPreviews;
    providesAppNotificationSettings?: boolean;
    allowsAnnouncements?: boolean | null;
  };
}

/**
 * Available configuration for permission request on iOS platform.
 * See Apple documentation for [`UNAuthorizationOptions`](https://developer.apple.com/documentation/usernotifications/unauthorizationoptions) to learn more.
 */
export interface IosNotificationPermissionsRequest {
  /**
   * The ability to display alerts.
   */
  allowAlert?: boolean;
  /**
   * The ability to update the app’s badge.
   */
  allowBadge?: boolean;
  /**
   * The ability to play sounds.
   */
  allowSound?: boolean;
  /**
   * The ability to display notifications in a CarPlay environment.
   */
  allowDisplayInCarPlay?: boolean;
  /**
   * The ability to play sounds for critical alerts.
   */
  allowCriticalAlerts?: boolean;
  /**
   * An option indicating the system should display a button for in-app notification settings.
   */
  provideAppNotificationSettings?: boolean;
  /**
   * The ability to post noninterrupting notifications provisionally to the Notification Center.
   */
  allowProvisional?: boolean;
  /**
   * The ability for Siri to automatically read out messages over AirPods.
   * @deprecated
   */
  allowAnnouncements?: boolean;
}

export type NativeNotificationPermissionsRequest = IosNotificationPermissionsRequest | object;

/**
 * An interface representing the permissions request scope configuration.
 * Each option corresponds to a different native platform authorization option.
 */
export interface NotificationPermissionsRequest {
  /**
   * Available configuration for permission request on iOS platform.
   */
  ios?: IosNotificationPermissionsRequest;
  /**
   * On Android, all available permissions are granted by default, and if a user declines any permission, an app cannot prompt the user to change.
   */
  android?: object;
}
