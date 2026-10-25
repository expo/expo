/**
 * Status of the device hinge, as reported by the state of Jetpack WindowManager's `FoldingFeature`
 * on Android and by UIKit's `UIHinge.Status` on iOS. Android has no public API for a closed hinge,
 * so it never reports `closed`. It reports `unknown` while the app's window does not span the fold,
 * such as on the outer screen of a closed device. To detect a closed device on Android, check for an
 * `angle` near `0` with a threshold that suits your app.
 */
export type HingeStatus = 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown';

/**
 * State of the device hinge.
 */
export type Hinge = {
  /**
   * The current angle of the hinge in degrees, where `0` is closed and `180` is flat. The rate and
   * granularity of angle updates are system policy, so do not depend on a particular update
   * frequency or precision. Prefer `status` when you only need to know whether the hinge is closed,
   * partially open, or fully open, except on Android, where `status` is never `closed`. On Android,
   * the angle comes from the hinge angle sensor.
   */
  angle: number;
  /**
   * The current status of the hinge, determined by the system from the angle and device orientation.
   */
  status: HingeStatus;
};

export type HingeChangeEvent = {
  /**
   * The current hinge, or `null` when the device has no hinge, the app's window provides no hinge
   * updates, or, on Android, the device has no hinge angle sensor.
   */
  hinge: Hinge | null;
};

export type ExpoHingeModuleEvents = {
  hingeChange: (event: HingeChangeEvent) => void;
};
