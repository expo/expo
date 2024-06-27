export { PermissionStatus, } from 'expo-modules-core';
// @needsAudit
/**
 * Describes the current generation of the cellular connection. It is an enum with these possible
 * values:
 */
export var CellularGeneration;
(function (CellularGeneration) {
    /**
     * Either we are not currently connected to a cellular network or type could not be determined.
     */
    CellularGeneration[CellularGeneration["UNKNOWN"] = 0] = "UNKNOWN";
    /**
     * Currently connected to a 2G cellular network. Includes CDMA, EDGE, GPRS, and IDEN type connections.
     */
    CellularGeneration[CellularGeneration["CELLULAR_2G"] = 1] = "CELLULAR_2G";
    /**
     * Currently connected to a 3G cellular network. Includes EHRPD, EVDO, HSPA, HSUPA, HSDPA, HSPAP, and UTMS type connections.
     */
    CellularGeneration[CellularGeneration["CELLULAR_3G"] = 2] = "CELLULAR_3G";
    /**
     * Currently connected to a 4G cellular network. Includes LTE type connections.
     */
    CellularGeneration[CellularGeneration["CELLULAR_4G"] = 3] = "CELLULAR_4G";
    /**
     * Currently connected to a 5G cellular network. Includes NR and NRNSA type connections.
     */
    CellularGeneration[CellularGeneration["CELLULAR_5G"] = 4] = "CELLULAR_5G";
})(CellularGeneration || (CellularGeneration = {}));
//# sourceMappingURL=Cellular.types.js.map