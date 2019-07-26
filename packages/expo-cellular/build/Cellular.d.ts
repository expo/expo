export declare const enum CellularGeneration {
    NULL = 0,
    "2G" = 1,
    "3G" = 2,
    "4G" = 3
}
export declare const allowsVoip: any;
export declare const carrier: any;
export declare const isoCountryCode: any;
export declare const mobileCountryCode: any;
export declare const mobileNetworkCode: any;
export declare function getCellularGenerationAsync(): Promise<CellularGeneration>;
