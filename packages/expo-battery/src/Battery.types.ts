// @needsAudit
export type PowerState = {
  /**
   * A number between `0` and `1`, inclusive, or `-1` if the battery level is unknown.
   */
  batteryLevel: number;
  /**
   * An enum value representing the battery state.
   */
  batteryState: BatteryState;
  /**
   * A boolean value, `true` if lowPowerMode is on, `false` if lowPowerMode is off.
   */
  lowPowerMode: boolean;
};

// @needsAudit
export enum BatteryState {
  /**
   * If the battery state is unknown or inaccessible.
   */
  UNKNOWN = 0,
  /**
   * If the battery is discharging (typically not connected to power). On Android, this
   * corresponds to [`BATTERY_STATUS_DISCHARGING`](https://developer.android.com/reference/android/os/BatteryManager#BATTERY_STATUS_DISCHARGING).
   */
  UNPLUGGED,
  /**
   * If battery is charging.
   */
  CHARGING,
  /**
   * If the battery level is full.
   */
  FULL,
  /**
   * The battery is not charging while power is connected (AC/USB/wireless), for
   * example when battery protection limits charge to 80%, or optimized charging pauses. This
   * differs from `UNPLUGGED` (discharging on battery). On iOS and web, this value is never returned.
   *
   * @platform android
   */
  NOT_CHARGING,
}

// @needsAudit
export type BatteryLevelEvent = {
  /**
   * A number between `0` and `1`, inclusive, or `-1` if the battery level is unknown.
   */
  batteryLevel: number;
};

// @needsAudit
export type BatteryStateEvent = {
  /**
   * An enum value representing the battery state.
   */
  batteryState: BatteryState;
};

// @needsAudit
export type PowerModeEvent = {
  /**
   * A boolean value, `true` if lowPowerMode is on, `false` if lowPowerMode is off.
   */
  lowPowerMode: boolean;
};

/**
 * @hidden
 */
export type BatteryEvents = {
  'Expo.batteryLevelDidChange'(event: BatteryLevelEvent): void;
  'Expo.batteryStateDidChange'(event: BatteryStateEvent): void;
  'Expo.powerModeDidChange'(event: PowerModeEvent): void;
};
