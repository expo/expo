/**
 * An enum representing the different types of devices supported by Expo.
 */
export enum DeviceType {
  /**
   * An unrecognized device type.
   */
  UNKNOWN = 0,
  /**
   * Mobile phone handsets, typically with a touch screen and held in one hand.
   */
  PHONE,
  /**
   * Tablet computers, typically with a touch screen that is larger than a usual phone.
   */
  TABLET,
  /**
   * Desktop or laptop computers, typically with a keyboard and mouse.
   */
  DESKTOP,
  /**
   * Device with TV-based interfaces.
   */
  TV,
}

/**
 * Represents a rectangle describing a camera cutout.
 * @platform android
 * @platform ios
 */
export interface CameraRect {
  x: number; // left in physical pixels
  y: number; // top in physical pixels
  width: number; // width in physical pixels
  height: number; // height in physical pixels
  radius?: number | null; // optional radius estimate in pixels
}

/**
 * Represents the camera cutout information.
 * @platform android
 * @platform ios
 */
export interface CameraCutoutInfo {
  hasCameraCutout: boolean;
  cameraRects: CameraRect[];
  safeInsets: { top: number; bottom: number; left: number; right: number }; // pixels
  type?: 'hole' | 'pill' | 'wide' | 'unknown';
}
