import { ProxyNativeModule } from '@unimodules/core';
import { PermissionResponse } from 'unimodules-permissions-interface';
export declare enum IosAlertStyle {
    NONE = 0,
    BANNER = 1,
    ALERT = 2
}
export declare enum IosAllowsPreviews {
    NEVER = 0,
    ALWAYS = 1,
    WHEN_AUTHENTICATED = 2
}
export declare enum IosAuthorizationStatus {
    NOT_DETERMINED = 0,
    DENIED = 1,
    AUTHORIZED = 2,
    PROVISIONAL = 3
}
export declare enum AndroidImportance {
    UNKNOWN = 0,
    UNSPECIFIED = 1,
    NONE = 2,
    MIN = 3,
    LOW = 4,
    DEEFAULT = 5,
    HIGH = 6,
    MAX = 7
}
export declare enum AndroidInterruptionFilter {
    UNKNOWN = 0,
    ALL = 1,
    PRIORITY = 2,
    NONE = 3,
    ALARMS = 4
}
export interface NotificationPermissionsStatus extends PermissionResponse {
    android?: {
        importance: AndroidImportance;
        interruptionFilter?: AndroidInterruptionFilter;
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
export interface AndroidNotificationPermissionRequest {
}
export declare type NativeNotificationPermissionsRequest = IosNotificationPermissionsRequest | AndroidNotificationPermissionRequest;
export interface NotificationPermissionsModule extends ProxyNativeModule {
    getPermissionsAsync: () => Promise<NotificationPermissionsStatus>;
    requestPermissionsAsync: (request: NativeNotificationPermissionsRequest) => Promise<NotificationPermissionsStatus>;
}
declare const _default: NotificationPermissionsModule;
export default _default;
