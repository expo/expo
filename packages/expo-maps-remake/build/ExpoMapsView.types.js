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
export var MapColorScheme;
(function (MapColorScheme) {
    MapColorScheme["LIGHT"] = "LIGHT";
    MapColorScheme["DARK"] = "DARK";
    MapColorScheme["FOLLOW_SYSTEM"] = "FOLLOW_SYSTEM";
})(MapColorScheme || (MapColorScheme = {}));
//# sourceMappingURL=ExpoMapsView.types.js.map