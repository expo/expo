// @needsAudit
export var BatteryState;
(function (BatteryState) {
    /**
     * If the battery state is unknown or inaccessible.
     */
    BatteryState[BatteryState["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * If the battery is discharging (typically not connected to power). On Android, this
     * corresponds to [`BATTERY_STATUS_DISCHARGING`](https://developer.android.com/reference/android/os/BatteryManager#BATTERY_STATUS_DISCHARGING).
     */
    BatteryState[BatteryState["UNPLUGGED"] = 1] = "UNPLUGGED";
    /**
     * If battery is charging.
     */
    BatteryState[BatteryState["CHARGING"] = 2] = "CHARGING";
    /**
     * If the battery level is full.
     */
    BatteryState[BatteryState["FULL"] = 3] = "FULL";
    /**
     * The battery is not charging while power is connected (AC/USB/wireless), for
     * example when battery protection limits charge to 80%, or optimized charging pauses. This
     * differs from `UNPLUGGED` (discharging on battery). On iOS and web, this value is never returned.
     *
     * @platform android
     */
    BatteryState[BatteryState["NOT_CHARGING"] = 4] = "NOT_CHARGING";
})(BatteryState || (BatteryState = {}));
//# sourceMappingURL=Battery.types.js.map