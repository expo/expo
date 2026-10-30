/**
 * The kind of a display feature reported by the system.
 *
 * Modeled on the reserved regions described in Apple's
 * [Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo)
 * Human Interface Guidelines and Tech Talk 111463, "Strike a pose with adaptive layouts on iPhone Duo".
 */
export enum DisplayFeatureType {
  /**
   * A region that divides the available space, such as the hinge of a partially folded device.
   */
  HINGE = 'hinge',
  /**
   * A region that occludes content, such as a front-facing camera.
   */
  CUTOUT = 'cutout',
}

/**
 * The posture of a `HINGE` display feature. Always `UNKNOWN` for `CUTOUT`.
 */
export enum DisplayFeatureState {
  UNKNOWN = 'unknown',
  POSTURE_FLAT = 'postureFlat',
  POSTURE_HALF_OPENED = 'postureHalfOpened',
}

/**
 * A rectangle in the app window's coordinate space, in points.
 */
export type DisplayFeatureRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * A single region of the display that content should avoid covering.
 */
export type DisplayFeature = {
  type: DisplayFeatureType;
  state: DisplayFeatureState;
  bounds: DisplayFeatureRect;
};

/**
 * The status of a device hinge, such as the one on iPhone Duo.
 */
export enum HingeStatus {
  CLOSED = 'closed',
  PARTIALLY_OPEN = 'partiallyOpen',
  FULLY_OPEN = 'fullyOpen',
}

/**
 * The live state of a device hinge.
 */
export type Hinge = {
  status: HingeStatus;
  /**
   * The current angle of the hinge in degrees, as reported by the system.
   */
  angle: number;
};

/**
 * The payload delivered to display-feature-change listeners.
 */
export type DisplayFeaturesChangeEvent = {
  displayFeatures: DisplayFeature[];
};

/**
 * The payload delivered to hinge-change listeners.
 */
export type HingeChangeEvent = {
  hinge: Hinge | null;
};
