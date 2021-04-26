// @needsAudit
export var BatteryState;
(function (BatteryState) {
    /**
     * if the battery state is unknown or inaccessible.
     */
    BatteryState[BatteryState["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * if battery is not charging or discharging.
     */
    BatteryState[BatteryState["UNPLUGGED"] = 1] = "UNPLUGGED";
    /**
     * if battery is charging.
     */
    BatteryState[BatteryState["CHARGING"] = 2] = "CHARGING";
    /**
     * if the battery level is full.
     */
    BatteryState[BatteryState["FULL"] = 3] = "FULL";
})(BatteryState || (BatteryState = {}));
//# sourceMappingURL=Battery.types.js.map