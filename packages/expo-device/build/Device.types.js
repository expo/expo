/**
 * An enum representing the different types of devices supported by Expo.
 */
export var DeviceType;
(function (DeviceType) {
    /**
     * An unrecognized device type.
     */
    DeviceType[DeviceType["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * Mobile phone handsets, typically with a touch screen and held in one hand.
     */
    DeviceType[DeviceType["PHONE"] = 1] = "PHONE";
    /**
     * Tablet computers, typically with a touch screen that is larger than a usual phone.
     */
    DeviceType[DeviceType["TABLET"] = 2] = "TABLET";
    /**
     * Desktop or laptop computers, typically with a keyboard and mouse.
     */
    DeviceType[DeviceType["DESKTOP"] = 3] = "DESKTOP";
    /**
     * Device with TV-based interfaces.
     */
    DeviceType[DeviceType["TV"] = 4] = "TV";
})(DeviceType || (DeviceType = {}));
//# sourceMappingURL=Device.types.js.map