import type { PermissionResponse } from 'expo';

export enum LocationScope {
  /**
   * On Android, `ACCESS_BACKGROUND_LOCATION` is granted.
   *
   * On iOS, the authorization is `Always`.
   */
  ALWAYS = 'always',
  /**
   * On Android, `ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION` is granted, but not
   * `ACCESS_BACKGROUND_LOCATION`.
   *
   * On iOS, the authorization is `When In Use`.
   */
  WHEN_IN_USE = 'whenInUse',
  /**
   * The app cannot read the location.
   */
  NOT_GRANTED = 'notGranted',
}

export enum LocationAccuracy {
  /**
   * The app receives the precise location.
   *
   * On Android, `ACCESS_FINE_LOCATION` is granted.
   *
   * On iOS, **Precise Location** is turned on for the app.
   */
  FULL = 'full',
  /**
   * The app receives an approximate location, accurate to kilometers rather than meters.
   *
   * On Android, only `ACCESS_COARSE_LOCATION` is granted.
   *
   * On iOS, **Precise Location** is turned off for the app.
   */
  REDUCED = 'reduced',
  /**
   * The app cannot read the location.
   */
  NOT_GRANTED = 'notGranted',
}

/**
 * The accuracy a permission request asks for.
 */
export enum RequestPermissionsAccuracyOption {
  /**
   * Asks for the precise location.
   *
   * On Android, requests `ACCESS_FINE_LOCATION` together with `ACCESS_COARSE_LOCATION`.
   *
   * On iOS, when the app holds a reduced accuracy, shows the system prompt for temporary full
   * accuracy after the permission is granted. The prompt needs the purpose string the config plugin
   * writes by default; `locationFullAccuracyPermission: false` removes it and skips the prompt.
   */
  FULL = 'full',
  /**
   * Asks for an approximate location only.
   *
   * On Android, requests `ACCESS_COARSE_LOCATION` alone, so the system dialog does not offer the
   * precise option.
   *
   * On iOS, never asks to raise a reduced accuracy.
   */
  REDUCED = 'reduced',
}

/**
 * Returned by the permission functions, with the location-specific `scope` and `accuracy`.
 */
export type LocationPermissionResponse = PermissionResponse & {
  /**
   * When the app can read the location: always, only while in use, or not at all.
   */
  scope: LocationScope;
  /**
   * Whether the app receives the precise or an approximate location.
   */
  accuracy: LocationAccuracy;
};

/**
 * Options for [`requestForegroundPermissions`](#requestforegroundpermissionsoptions) and
 * [`requestBackgroundPermissions`](#requestbackgroundpermissionsoptions).
 */
export type RequestPermissionsOptions = {
  /**
   * The accuracy to ask for. Ignored by `requestBackgroundPermissions` on Android.
   * @default RequestPermissionsAccuracyOption.FULL
   */
  accuracy?: RequestPermissionsAccuracyOption;
};
