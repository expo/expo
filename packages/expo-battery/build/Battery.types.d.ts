export declare type PowerState = {
    batteryLevel?: number;
    batteryState?: BatteryState;
    lowPowerMode?: boolean;
};
export declare const enum BatteryState {
    UNPLUGGED = "UNPLUGGED",
    CHARGING = "CHARGING",
    FULL = "FULL",
    UNKNOWN = "UNKNOWN"
}
export declare type batteryLevel = {
    batteryLevel: number;
};
export declare type batteryState = {
    batteryState: batteryState;
};
export declare type lowPowerMode = {
    lowPowerMode: boolean;
};
export declare type BatteryLevelUpdateCallback = (batteryLevel: batteryLevel) => void;
export declare type BatteryStateUpdateCallback = (batteryState: batteryState) => void;
export declare type PowerModeUpdateCallback = (lowPowerMode: lowPowerMode) => void;
export declare type BatteryListener = {
    remove: () => void;
};
