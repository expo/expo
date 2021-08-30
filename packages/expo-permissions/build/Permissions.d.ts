import { PermissionResponse, PermissionType, PermissionMap, PermissionStatus, PermissionExpiration, PermissionInfo } from './Permissions.types';
export { PermissionStatus, PermissionResponse, PermissionExpiration, PermissionMap, PermissionInfo, PermissionType, };
export declare const CAMERA = "camera";
export declare const MEDIA_LIBRARY = "mediaLibrary";
export declare const MEDIA_LIBRARY_WRITE_ONLY = "mediaLibraryWriteOnly";
/**
 * @deprecated Use `MEDIA_LIBRARY` or `MEDIA_LIBRARY_WRITE_ONLY`
 */
export declare const CAMERA_ROLL = "mediaLibrary";
export declare const AUDIO_RECORDING = "audioRecording";
/** @deprecated Use `LOCATION_FOREGROUND` or `LOCATION_BACKGROUND` instead */
export declare const LOCATION = "location";
export declare const LOCATION_FOREGROUND = "locationForeground";
export declare const LOCATION_BACKGROUND = "locationBackground";
export declare const USER_FACING_NOTIFICATIONS = "userFacingNotifications";
export declare const NOTIFICATIONS = "notifications";
export declare const CONTACTS = "contacts";
export declare const CALENDAR = "calendar";
export declare const REMINDERS = "reminders";
export declare const SYSTEM_BRIGHTNESS = "systemBrightness";
export declare const MOTION = "motion";
export declare function getAsync(...types: PermissionType[]): Promise<PermissionResponse>;
export declare function askAsync(...types: PermissionType[]): Promise<PermissionResponse>;
