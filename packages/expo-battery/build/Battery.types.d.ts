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
export declare enum BatteryState {
    /**
     * If the battery state is unknown or inaccessible.
     */
    UNKNOWN = 0,
    /**
     * If battery is not charging or discharging.
     */
    UNPLUGGED = 1,
    /**
     * If battery is charging.
     */
    CHARGING = 2,
    /**
     * If the battery level is full.
     */
    FULL = 3
}
export type BatteryLevelEvent = {
    /**
     * A number between `0` and `1`, inclusive, or `-1` if the battery level is unknown.
     */
    batteryLevel: number;
};
export type BatteryStateEvent = {
    /**
     * An enum value representing the battery state.
     */
    batteryState: BatteryState;
};
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
    'Expo.batteryLevelDidChange'(event: BatteryLevelEvent): any;
    'Expo.batteryStateDidChange'(event: BatteryStateEvent): any;
    'Expo.powerModeDidChange'(event: PowerModeEvent): any;
};
//# sourceMappingURL=Battery.types.d.ts.map