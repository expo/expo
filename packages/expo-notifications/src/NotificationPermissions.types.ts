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

export interface IosNotificationPermissionsRequest {
  allowAlert?: boolean;
  allowBadge?: boolean;
  allowSound?: boolean;
  allowDisplayInCarPlay?: boolean;
  allowCriticalAlerts?: boolean;
  provideAppNotificationSettings?: boolean;
  allowProvisional?: boolean;
  allowAnnouncements?: boolean;
}

export interface AndroidNotificationPermissionRequest {}

export type NativeNotificationPermissionsRequest =
  | IosNotificationPermissionsRequest
  | AndroidNotificationPermissionRequest;

export interface NotificationPermissionsRequest {
  ios?: IosNotificationPermissionsRequest;
  android?: AndroidNotificationPermissionRequest;
}
