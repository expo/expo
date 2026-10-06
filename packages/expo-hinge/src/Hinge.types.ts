/**
 * Status of the device hinge, as reported by UIKit's `UIHinge.Status`.
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
   * partially open or fully open.
   */
  angle: number;
  /**
   * The current status of the hinge, determined by the system from the angle and device orientation.
   */
  status: HingeStatus;
};

export type HingeChangeEvent = {
  /**
   * The current hinge, or `null` when the device has no hinge or the app's window provides no hinge
   * updates.
   */
  hinge: Hinge | null;
};

export type ExpoHingeModuleEvents = {
  hingeChange: (event: HingeChangeEvent) => void;
};
