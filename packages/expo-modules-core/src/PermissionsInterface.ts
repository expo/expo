export enum PermissionStatus {
  /**
   * User has granted the permission.
   */
  GRANTED = 'granted',
  /**
   * User hasn't granted or denied the permission yet.
   */
  UNDETERMINED = 'undetermined',
  /**
   * User has denied the permission.
   */
  DENIED = 'denied',
}

/**
 * Permission expiration time. Currently, all permissions are granted permamently.
 */
export type PermissionExpiration = 'never' | number;

/**
 * An object obtained by `getPermissionsAsync` and `requestPermissionsAsync` functions.
 */
export interface PermissionResponse {
  /**
   * Determines the status of the permission.
   */
  status: PermissionStatus;
  /**
   * Determines time when the permission expires.
   */
  expires: PermissionExpiration;
  /**
   * A convenience boolean that indicates if the permission is granted.
   */
  granted: boolean;
  /**
   * Indicates if user can be asked again for specific permission.
   * If not, one should be directed to the Settings app
   * in order to enable/disable the permission.
   */
  canAskAgain: boolean;
}
