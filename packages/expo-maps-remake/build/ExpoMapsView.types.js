/**
 * The type of map to display.
 */
export var MapType;
(function (MapType) {
    /**
     * Satellite imagery with roads and points of interest overlayed.
     */
    MapType["HYBRID"] = "HYBRID";
    /**
     * Standard road map.
     */
    MapType["NORMAL"] = "NORMAL";
    /**
     * Satellite imagery.
     */
    MapType["SATELLITE"] = "SATELLITE";
    /**
     * Topographic data.
     */
    MapType["TERRAIN"] = "TERRAIN";
})(MapType || (MapType = {}));
export var AppleMapType;
(function (AppleMapType) {
    /**
     * Satellite imagery with roads and points of interest overlayed.
     */
    AppleMapType["HYBRID"] = "HYBRID";
    /**
     * Creates a standard map style.
     */
    AppleMapType["STANDARD"] = "STANDARD";
    /**
     * A map style that represents a satellite image of the area the map displays.
     */
    AppleMapType["IMAGERY"] = "IMAGERY";
})(AppleMapType || (AppleMapType = {}));
export var MapColorScheme;
(function (MapColorScheme) {
    MapColorScheme["LIGHT"] = "LIGHT";
    MapColorScheme["DARK"] = "DARK";
    MapColorScheme["FOLLOW_SYSTEM"] = "FOLLOW_SYSTEM";
})(MapColorScheme || (MapColorScheme = {}));
//# sourceMappingURL=ExpoMapsView.types.js.map