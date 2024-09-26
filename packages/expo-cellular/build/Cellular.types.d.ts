export { PermissionResponse, PermissionStatus, PermissionExpiration, PermissionHookOptions, } from 'expo-modules-core';
/**
 * Describes the current generation of the cellular connection. It is an enum with these possible
 * values:
 */
export declare enum CellularGeneration {
    /**
     * Either we are not currently connected to a cellular network or type could not be determined.
     */
    UNKNOWN = 0,
    /**
     * Currently connected to a 2G cellular network. Includes CDMA, EDGE, GPRS, and IDEN type connections.
     */
    CELLULAR_2G = 1,
    /**
     * Currently connected to a 3G cellular network. Includes EHRPD, EVDO, HSPA, HSUPA, HSDPA, HSPAP, and UTMS type connections.
     */
    CELLULAR_3G = 2,
    /**
     * Currently connected to a 4G cellular network. Includes LTE type connections.
     */
    CELLULAR_4G = 3,
    /**
     * Currently connected to a 5G cellular network. Includes NR and NRNSA type connections.
     */
    CELLULAR_5G = 4
}
//# sourceMappingURL=Cellular.types.d.ts.map