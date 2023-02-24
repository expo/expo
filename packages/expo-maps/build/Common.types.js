/**
 * Possible power priorities for OnLocationChange event
 */
export var LocationChangePriority;
(function (LocationChangePriority) {
    /**
     * Best accuracy that the device can acquire. Will consume more power.
     */
    LocationChangePriority[LocationChangePriority["PRIORITY_HIGH_ACCURACY"] = 100] = "PRIORITY_HIGH_ACCURACY";
    /**
     * Bock level accuracy. Block level accuracy is considered to be about 100 meter accuracy.
     */
    LocationChangePriority[LocationChangePriority["PRIORITY_BALANCED_POWER_ACCURACY"] = 102] = "PRIORITY_BALANCED_POWER_ACCURACY";
    /**
     * City level accuracy. City level accuracy is considered to be about 10km accuracy.
     * Using a coarse accuracy such as this often consumes less power
     */
    LocationChangePriority[LocationChangePriority["PRIORITY_LOW_POWER"] = 104] = "PRIORITY_LOW_POWER";
    /**
     * No locations will be returned unless a different client has requested location updates in which case
     * this request will act as a passive listener to those locations. Will use no additional power
     */
    LocationChangePriority[LocationChangePriority["PRIORITY_NO_POWER"] = 105] = "PRIORITY_NO_POWER";
})(LocationChangePriority || (LocationChangePriority = {}));
//# sourceMappingURL=Common.types.js.map