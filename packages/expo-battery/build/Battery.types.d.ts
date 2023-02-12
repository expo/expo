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
     * A boolean value, `true` if lowPowerMode is on, `false` if lowPowerMode is off
     */
    lowPowerMode: boolean;
};
export declare enum BatteryState {
    /**
     * if the battery state is unknown or inaccessible.
     */
    UNKNOWN = 0,
    /**
     * if battery is not charging or discharging.
     */
    UNPLUGGED = 1,
    /**
     * if battery is charging.
     */
    CHARGING = 2,
    /**
     * if the battery level is full.
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
     * A boolean value, `true` if lowPowerMode is on, `false` if lowPowerMode is off
     */
    lowPowerMode: boolean;
};
//# sourceMappingURL=Battery.types.d.ts.map