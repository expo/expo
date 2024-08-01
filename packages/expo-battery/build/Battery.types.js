// @needsAudit
export var BatteryState;
(function (BatteryState) {
    /**
     * If the battery state is unknown or inaccessible.
     */
    BatteryState[BatteryState["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * If battery is not charging or discharging.
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
})(BatteryState || (BatteryState = {}));
//# sourceMappingURL=Battery.types.js.map