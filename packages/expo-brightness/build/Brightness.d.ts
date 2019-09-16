export declare enum BrightnessMode {
    UNKNOWN = 0,
    AUTOMATIC = 1,
    MANUAL = 2
}
export declare const PermissionsStatus: {
    readonly GRANTED: "granted";
    readonly UNDETERMINED: "undetermined";
    readonly DENIED: "denied";
};
export declare type PermissionsResponse = {
    status: typeof PermissionsStatus[keyof typeof PermissionsStatus];
    expires: "never" | number;
    granted: boolean;
};
export declare function getBrightnessAsync(): Promise<number>;
export declare function setBrightnessAsync(brightnessValue: number): Promise<void>;
export declare function getSystemBrightnessAsync(): Promise<number>;
export declare function setSystemBrightnessAsync(brightnessValue: number): Promise<void>;
export declare function useSystemBrightnessAsync(): Promise<void>;
export declare function isUsingSystemBrightnessAsync(): Promise<boolean>;
export declare function getSystemBrightnessModeAsync(): Promise<BrightnessMode>;
export declare function setSystemBrightnessModeAsync(brightnessMode: BrightnessMode): Promise<void>;
export declare function getPermissionsAsync(): Promise<PermissionsResponse>;
export declare function requestPermissionsAsync(): Promise<PermissionsResponse>;
