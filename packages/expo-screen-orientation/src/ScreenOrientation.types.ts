// @needsAudit
export enum Orientation {
  /**
   * An unknown screen orientation. For example, the device is flat, perhaps on a table.
   */
  UNKNOWN = 0,
  /**
   * Right-side up portrait interface orientation.
   */
  PORTRAIT_UP = 1,
  /**
   * Upside down portrait interface orientation.
   */
  PORTRAIT_DOWN = 2,
  /**
   * Left landscape interface orientation.
   */
  LANDSCAPE_LEFT = 3,
  /**
   * Right landscape interface orientation.
   */
  LANDSCAPE_RIGHT = 4,
}

// @needsAudit
/**
 * An enum whose values can be passed to the [`lockAsync`](#screenorientationlockasyncorientationlock)
 * method.
 * > __Note:__ `OrientationLock.ALL` and `OrientationLock.PORTRAIT` are invalid on devices which
 * > don't support `OrientationLock.PORTRAIT_DOWN`.
 */
export enum OrientationLock {
  /**
   * The default orientation. On iOS, this will allow all orientations except `Orientation.PORTRAIT_DOWN`.
   * On Android, this lets the system decide the best orientation.
   */
  DEFAULT = 0,
  /**
   * All four possible orientations
   */
  ALL = 1,
  /**
   * Any portrait orientation.
   */
  PORTRAIT = 2,
  /**
   * Right-side up portrait only.
   */
  PORTRAIT_UP = 3,
  /**
   * Upside down portrait only.
   */
  PORTRAIT_DOWN = 4,
  /**
   * Any landscape orientation.
   */
  LANDSCAPE = 5,
  /**
   * Left landscape only.
   */
  LANDSCAPE_LEFT = 6,
  /**
   * Right landscape only.
   */
  LANDSCAPE_RIGHT = 7,
  /**
   * A platform specific orientation. This is not a valid policy that can be applied in [`lockAsync`](#screenorientationlockasyncorientationlock).
   */
  OTHER = 8,
  /**
   * An unknown screen orientation lock. This is not a valid policy that can be applied in [`lockAsync`](#screenorientationlockasyncorientationlock).
   */
  UNKNOWN = 9,
}

// @needsAudit
/**
 * Each iOS device has a default set of [size classes](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html)
 * that you can use as a guide when designing your interface.
 */
export enum SizeClassIOS {
  REGULAR = 0,
  COMPACT = 1,
  UNKNOWN = 2,
}

// @needsAudit
/**
 * An enum representing the lock policies that can be applied on the web platform, modelled after
 * the [W3C specification](https://w3c.github.io/screen-orientation/#dom-orientationlocktype).
 * These values can be applied through the [`lockPlatformAsync`](#screenorientationlockplatformasyncoptions)
 * method.
 */
export enum WebOrientationLock {
  PORTRAIT_PRIMARY = 'portrait-primary',
  PORTRAIT_SECONDARY = 'portrait-secondary',
  PORTRAIT = 'portrait',
  LANDSCAPE_PRIMARY = 'landscape-primary',
  LANDSCAPE_SECONDARY = 'landscape-secondary',
  LANDSCAPE = 'landscape',
  ANY = 'any',
  NATURAL = 'natural',
  UNKNOWN = 'unknown',
}

// @docsMissing
export enum WebOrientation {
  PORTRAIT_PRIMARY = 'portrait-primary',
  PORTRAIT_SECONDARY = 'portrait-secondary',
  LANDSCAPE_PRIMARY = 'landscape-primary',
  LANDSCAPE_SECONDARY = 'landscape-secondary',
}

// @needsAudit
export type PlatformOrientationInfo = {
  /**
   * A constant to set using the Android native [API](https://developer.android.com/reference/android/R.attr.html#screenOrientation).
   * For example, in order to set the lock policy to [unspecified](https://developer.android.com/reference/android/content/pm/ActivityInfo.html#SCREEN_ORIENTATION_UNSPECIFIED),
   * `-1` should be passed in.
   * @platform android
   */
  screenOrientationConstantAndroid?: number;
  /**
   * An array of orientations to allow on the iOS platform.
   * @platform ios
   */
  screenOrientationArrayIOS?: Orientation[];
  /**
   * A web orientation lock to apply in the browser.
   * @platform web
   */
  screenOrientationLockWeb?: WebOrientationLock;
};

// @needsAudit
export type ScreenOrientationInfo = {
  /**
   * The current orientation of the device.
   */
  orientation: Orientation;
  /**
   * The [vertical size class](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html)
   * of the device.
   * @platform ios
   */
  verticalSizeClass?: SizeClassIOS;
  /**
   * The [horizontal size class](https://developer.apple.com/library/archive/featuredarticles/ViewControllerPGforiPhoneOS/TheAdaptiveModel.html)
   * of the device.
   * @platform ios
   */
  horizontalSizeClass?: SizeClassIOS;
};

export type OrientationChangeListener = (event: OrientationChangeEvent) => void;

// @needsAudit
export type OrientationChangeEvent = {
  /**
   * The current `OrientationLock` of the device.
   */
  orientationLock: OrientationLock;
  /**
   * The current `ScreenOrientationInfo` of the device.
   */
  orientationInfo: ScreenOrientationInfo;
};
